import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import App from "../models/App";
import Release from "../models/Release";
import { requireAuth, requireDeveloper, AuthRequest } from "../middleware/auth";
import { Router as PublicRouter, Request as Req, Response as Res } from "express";

const router = Router();

// ─── Encryption Helpers ───────────────────────────────────────────────────────
const ENCRYPTION_KEY = (process.env.ENV_ENCRYPTION_KEY || "duspace-env-secret-key-32-chars!").slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");
  if (!ivHex || !encryptedHex) return "";
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
  return decrypted.toString();
}

function maskValue(value: string): string {
  if (value.length <= 4) return "•".repeat(value.length);
  return value.slice(0, 2) + "•".repeat(Math.max(value.length - 4, 4)) + value.slice(-2);
}

// ─── Multer Storage ───────────────────────────────────────────────────────────
const uploadDir: string = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = (req as AuthRequest).userId as string;
    const developerDir = path.join(uploadDir, userId);
    if (!fs.existsSync(developerDir)) fs.mkdirSync(developerDir, { recursive: true });
    cb(null, developerDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const ALLOWED_TYPES = [
  "application/octet-stream", "application/x-msdownload", "application/x-msdos-program",
  "application/x-exe", "application/x-winexe", "application/zip", "application/x-rar-compressed",
  "application/x-7z-compressed", "application/gzip", "application/x-tar", "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm",
  "text/plain", "application/json", "application/xml", "text/xml",
  "text/javascript", "application/javascript", "text/html", "text/css",
  "text/x-python", "text/x-java-source", "text/x-c", "text/x-cpp",
];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type not allowed: ${file.mimetype}`));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 500 * 1024 * 1024 } });

const coverUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Cover image must be a JPEG, PNG, GIF, or WebP image"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function determineFileType(mimeType: string, originalName: string): "executable" | "installer" | "source" | "document" | "media" | "archive" | "other" {
  const ext = path.extname(originalName).toLowerCase().slice(1);
  if (["exe", "dll", "app", "bin"].includes(ext)) return "executable";
  if (["msi", "dmg", "pkg", "deb", "rpm"].includes(ext)) return "installer";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["pdf", "doc", "docx", "xls", "xlsx"].includes(ext)) return "document";
  if (mimeType.startsWith("image/") || mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "media";
  if (["js", "ts", "py", "java", "cpp", "c", "html", "css", "json", "xml"].includes(ext)) return "source";
  return "other";
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = base;
  let count = 1;
  while (true) {
    const query: any = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await App.findOne(query);
    if (!existing) return slug;
    slug = `${base}-${count++}`;
  }
}

// ─── POST /api/developer/apps — Create project ────────────────────────────────
router.post("/apps", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, shortDescription, description, projectType, category,
      tags, languages, frameworks, license, repositoryUrl, documentationUrl, websiteUrl,
      version,
    } = req.body;

    if (!name?.trim()) { res.status(400).json({ error: "Project name is required" }); return; }

    const slug = await generateUniqueSlug(name.trim());

    const app = new App({
      developerId: req.userId,
      slug,
      name: name.trim(),
      shortDescription: shortDescription?.trim() || "",
      description: description?.trim() || "",
      projectType: projectType || "web-app",
      category: category || "Utilities",
      tags: Array.isArray(tags) ? tags : [],
      languages: Array.isArray(languages) ? languages : [],
      frameworks: Array.isArray(frameworks) ? frameworks : [],
      license: license?.trim() || "",
      repositoryUrl: repositoryUrl?.trim() || "",
      documentationUrl: documentationUrl?.trim() || "",
      websiteUrl: websiteUrl?.trim() || "",
      currentVersion: version || "—",
      status: "draft",
      visibility: "private",
    });

    await app.save();
    res.status(201).json({ app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/developer/apps — List all projects ──────────────────────────────
router.get("/apps", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, q } = req.query as Record<string, string>;
    const filter: any = { developerId: req.userId };
    if (status && status !== "all") filter.status = status;
    if (q) filter.name = { $regex: q, $options: "i" };
    const apps = await App.find(filter).sort({ createdAt: -1 }).select("-envVars");
    res.json({ apps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/developer/apps/:appId — Get one project ────────────────────────
router.get("/apps/:appId", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId).select("-envVars");
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }
    res.json({ app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/developer/apps/:appId — Update project metadata ────────────────
router.put("/apps/:appId", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const fields = [
      "name", "shortDescription", "description", "projectType", "category",
      "tags", "languages", "frameworks", "license", "repositoryUrl",
      "documentationUrl", "websiteUrl", "visibility", "releaseNotes", "requirements", "currentVersion",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) (app as any)[f] = req.body[f];
    }

    // Build config
    if (req.body.buildConfig) {
      app.buildConfig = { ...app.buildConfig, ...req.body.buildConfig };
    }

    // Slug update if name changed
    if (req.body.name && req.body.name.trim() !== app.name) {
      app.name = req.body.name.trim();
      app.slug = await generateUniqueSlug(app.name, app._id.toString());
    }

    // Detected tech override
    if (req.body.detectedTech) {
      app.detectedTech = { ...app.detectedTech, ...req.body.detectedTech, isEdited: true };
    }

    await app.save();
    res.json({ app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/developer/apps/:appId/detect — Auto-detect tech ───────────────
router.post("/apps/:appId/detect", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    // Phase 1: heuristic detection based on files and import source
    const detected: any = {
      language: "Unknown",
      framework: "Unknown",
      packageManager: "Unknown",
      runtime: "Unknown",
      buildCommand: "",
      startCommand: "",
      outputDirectory: "",
    };

    const fileNames = app.files.map((f) => f.originalName.toLowerCase());
    const importType = app.importSource?.type;

    // Detect by file names
    if (fileNames.some((f) => f === "package.json")) {
      detected.runtime = "Node.js";
      detected.language = "JavaScript / TypeScript";
      detected.packageManager = fileNames.includes("pnpm-lock.yaml")
        ? "pnpm"
        : fileNames.includes("yarn.lock")
        ? "yarn"
        : "npm";
    }
    if (fileNames.some((f) => f === "next.config.js" || f === "next.config.ts" || f === "next.config.mjs")) {
      detected.framework = "Next.js";
      detected.buildCommand = `${detected.packageManager} run build`;
      detected.startCommand = `${detected.packageManager} start`;
      detected.outputDirectory = ".next";
    } else if (fileNames.some((f) => f === "vite.config.ts" || f === "vite.config.js")) {
      detected.framework = "Vite";
      detected.buildCommand = `${detected.packageManager} run build`;
      detected.startCommand = `${detected.packageManager} run dev`;
      detected.outputDirectory = "dist";
    } else if (fileNames.some((f) => f === "angular.json")) {
      detected.framework = "Angular";
      detected.buildCommand = "ng build";
      detected.startCommand = "ng serve";
      detected.outputDirectory = "dist";
    } else if (fileNames.some((f) => f === "nuxt.config.ts" || f === "nuxt.config.js")) {
      detected.framework = "Nuxt.js";
      detected.buildCommand = `${detected.packageManager} run build`;
      detected.startCommand = `${detected.packageManager} run dev`;
      detected.outputDirectory = ".nuxt";
    } else if (fileNames.some((f) => f.includes("requirements.txt"))) {
      detected.language = "Python";
      detected.runtime = "Python";
      detected.packageManager = "pip";
      detected.buildCommand = "pip install -r requirements.txt";
      detected.startCommand = "python main.py";
    } else if (fileNames.some((f) => f === "go.mod")) {
      detected.language = "Go";
      detected.runtime = "Go";
      detected.buildCommand = "go build";
      detected.startCommand = "./main";
    } else if (fileNames.some((f) => f === "cargo.toml")) {
      detected.language = "Rust";
      detected.runtime = "Rust";
      detected.buildCommand = "cargo build --release";
      detected.startCommand = "./target/release/app";
    } else if (fileNames.some((f) => f === "pom.xml" || f === "build.gradle")) {
      detected.language = "Java";
      detected.runtime = "JVM";
      detected.packageManager = fileNames.includes("pom.xml") ? "Maven" : "Gradle";
      detected.buildCommand = fileNames.includes("pom.xml") ? "mvn package" : "gradle build";
    }

    // Store detected tech
    app.detectedTech = { ...detected, detectedAt: new Date(), isEdited: false };
    await app.save();

    res.json({ detected, app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/developer/apps/:appId/env — Get env vars (masked) ──────────────
router.get("/apps/:appId/env", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const masked = app.envVars.map((ev) => ({
      key: ev.key,
      value: ev.isSecret ? maskValue(decrypt(ev.encryptedValue)) : decrypt(ev.encryptedValue),
      isSecret: ev.isSecret,
    }));

    res.json({ envVars: masked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/developer/apps/:appId/env — Save env vars (encrypted) ──────────
router.put("/apps/:appId/env", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const { envVars } = req.body as { envVars: { key: string; value: string; isSecret: boolean }[] };
    if (!Array.isArray(envVars)) { res.status(400).json({ error: "envVars must be an array" }); return; }

    app.envVars = envVars.map((ev) => ({
      key: ev.key.trim(),
      encryptedValue: encrypt(ev.value),
      isSecret: ev.isSecret ?? true,
    }));

    await app.save();
    res.json({ message: "Environment variables saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/developer/apps/:appId/upload — Upload files ───────────────────
router.post(
  "/apps/:appId/upload",
  requireDeveloper,
  upload.array("files", 10),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const app = await App.findById(req.params.appId);
      if (!app) { res.status(404).json({ error: "Project not found" }); return; }
      if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }
      if (!req.files || req.files.length === 0) { res.status(400).json({ error: "No files uploaded" }); return; }

      // Track import source for ZIP uploads
      const zipFile = (req.files as Express.Multer.File[]).find((f) =>
        f.originalname.toLowerCase().endsWith(".zip")
      );
      if (zipFile && !app.importSource) {
        app.importSource = { type: "zip", importedAt: new Date() };
      }

      const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        fileType: determineFileType(file.mimetype, file.originalname),
      }));

      app.files.push(...uploadedFiles);
      await app.save();

      res.json({ message: "Files uploaded successfully", app });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ─── POST /api/developer/apps/:appId/cover — Upload cover image ──────────────
router.post(
  "/apps/:appId/cover",
  requireDeveloper,
  coverUpload.single("cover"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const app = await App.findById(req.params.appId);
      if (!app) { res.status(404).json({ error: "Project not found" }); return; }
      if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }
      if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

      // Delete old cover if exists
      if (app.coverImage) {
        const oldCoverPath = path.join(uploadDir, req.userId as string, path.basename(app.coverImage));
        if (fs.existsSync(oldCoverPath)) fs.unlinkSync(oldCoverPath);
      }

      app.coverImage = `/uploads/${req.userId}/${req.file.filename}`;
      await app.save();

      res.json({ message: "Cover image uploaded successfully", coverImage: app.coverImage });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ─── DELETE /api/developer/apps/:appId/cover — Remove cover image ────────────
router.delete("/apps/:appId/cover", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    if (app.coverImage) {
      const oldCoverPath = path.join(uploadDir, req.userId as string, path.basename(app.coverImage));
      if (fs.existsSync(oldCoverPath)) fs.unlinkSync(oldCoverPath);
      app.coverImage = undefined;
      await app.save();
    }

    res.json({ message: "Cover image removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/developer/apps/:appId/import/github — GitHub import ────────────
router.post("/apps/:appId/import/github", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const { repoUrl, branch, repoName } = req.body;
    if (!repoUrl) { res.status(400).json({ error: "Repository URL is required" }); return; }

    // Phase 1: store metadata, no actual clone
    app.importSource = {
      type: "github",
      githubRepoUrl: repoUrl,
      githubBranch: branch || "main",
      githubRepoName: repoName || repoUrl.split("/").pop() || "",
      importedAt: new Date(),
    };
    if (!app.repositoryUrl) app.repositoryUrl = repoUrl;

    await app.save();
    res.json({ message: "GitHub repository linked", app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/developer/apps/:appId/import/git — Git URL import ──────────────
router.post("/apps/:appId/import/git", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const { gitUrl, branch } = req.body;
    if (!gitUrl) { res.status(400).json({ error: "Git URL is required" }); return; }

    app.importSource = {
      type: "git",
      gitUrl,
      gitBranch: branch || "main",
      importedAt: new Date(),
    };
    if (!app.repositoryUrl) app.repositoryUrl = gitUrl;

    await app.save();
    res.json({ message: "Git repository linked", app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/developer/apps/:appId/publish — Publish project ────────────────
router.put("/apps/:appId/publish", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    app.status = "published";
    app.visibility = "public";
    app.publishedAt = new Date();
    await app.save();

    res.json({ app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/developer/apps/:appId/archive — Archive project ────────────────
router.put("/apps/:appId/archive", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    app.status = "archived";
    app.visibility = "private";
    await app.save();

    res.json({ message: "Project archived", app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE /api/developer/apps/:appId/files/:filename ───────────────────────
router.delete("/apps/:appId/files/:filename", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId } = req.params;
    const filename = req.params.filename as string;
    const app = await App.findById(appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const fileIndex = app.files.findIndex((f) => f.filename === filename);
    if (fileIndex === -1) { res.status(404).json({ error: "File not found" }); return; }

    const filePath = path.join(uploadDir, req.userId as string, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    app.files.splice(fileIndex, 1);
    await app.save();
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE /api/developer/apps/:appId — Delete project ──────────────────────
router.delete("/apps/:appId", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findById(req.params.appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const developerDir = path.join(uploadDir, req.userId as string);
    const releases = await Release.find({ projectId: app.id }).select("files screenshots icon").lean();
    const uploadedPaths = new Set<string>();

    app.files.forEach((file) => uploadedPaths.add(file.filename));
    releases.forEach((release) => {
      release.files.forEach((file) => uploadedPaths.add(file.filename));
      release.screenshots.forEach((screenshot) => uploadedPaths.add(path.basename(screenshot)));
      if (release.icon) uploadedPaths.add(path.basename(release.icon));
    });
    [app.coverImage, app.icon, app.banner, ...app.screenshots]
      .filter((asset): asset is string => Boolean(asset))
      .forEach((asset) => uploadedPaths.add(path.basename(asset)));

    for (const filename of uploadedPaths) {
      const filePath = path.join(developerDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Promise.all([
      Release.deleteMany({ projectId: app.id }),
      App.findByIdAndDelete(req.params.appId),
    ]);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUBLIC: GET /api/apps ───────────────────────────────────────────────────
const publicRouter = PublicRouter();

publicRouter.get("/", async (req: Req, res: Res): Promise<void> => {
  try {
    const { category, sort = "newest", limit = "24", page = "1", q } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { status: "published", visibility: "public" };
    if (category && category !== "all") filter.category = category;
    if (q) filter.name = { $regex: q, $options: "i" };

    const limitNum = Math.min(parseInt(limit, 10) || 24, 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:    { publishedAt: -1 },
      oldest:    { publishedAt: 1 },
      rating:    { rating: -1 },
      downloads: { downloads: -1 },
    };

    const [apps, total] = await Promise.all([
      App.find(filter).sort(sortMap[sort] ?? sortMap.newest).skip((pageNum - 1) * limitNum).limit(limitNum).select("-envVars").lean(),
      App.countDocuments(filter),
    ]);

    res.json({ apps, pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) } });
  } catch (err) {
    console.error("Public apps fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Public: GET /api/apps/:slug
publicRouter.get("/:slug/files/:filename", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await App.findOne({
      slug: req.params.slug,
      status: "published",
      visibility: "public",
    }).lean();
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }

    const filename = path.basename(req.params.filename as string);
    const file = app.files.find((entry) => entry.filename === filename);
    if (!file) { res.status(404).json({ error: "File not found" }); return; }

    const filePath = path.join(uploadDir, app.developerId, filename);
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: "File is unavailable" }); return; }

    await App.findByIdAndUpdate(app._id, { $inc: { downloads: 1 } });
    res.download(filePath, file.originalName);
  } catch (err) {
    console.error("Public file download error:", err);
    res.status(500).json({ error: "Unable to download file" });
  }
});

publicRouter.get("/:slug", async (req: Req, res: Res): Promise<void> => {
  try {
    const app = await App.findOne({ slug: req.params.slug, status: "published", visibility: "public" }).select("-envVars").lean();
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    // Increment views
    await App.findByIdAndUpdate(app._id, { $inc: { views: 1 } });
    res.json({ app });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export { publicRouter as publicAppsRouter };
export default router;
