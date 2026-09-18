import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import App from "../models/App";
import Release from "../models/Release";
import { requireDeveloper, AuthRequest } from "../middleware/auth";

const router = Router({ mergeParams: true }); // mergeParams to access :appId from parent

// ─── Multer for release file uploads ─────────────────────────────────────────
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = (req as AuthRequest).userId as string;
    const dir = path.join(uploadDir, userId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

function determineFileType(mimeType: string, originalName: string): "executable" | "installer" | "source" | "document" | "media" | "archive" | "other" {
  const ext = path.extname(originalName).toLowerCase().slice(1);
  if (["exe", "dll", "app", "bin"].includes(ext)) return "executable";
  if (["msi", "dmg", "pkg", "deb", "rpm"].includes(ext)) return "installer";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["pdf", "doc", "docx"].includes(ext)) return "document";
  if (mimeType.startsWith("image/") || mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "media";
  if (["js", "ts", "py", "java", "cpp", "c", "html", "css", "json", "xml"].includes(ext)) return "source";
  return "other";
}

// ─── POST /api/developer/apps/:appId/releases — Create release ───────────────
router.post("/", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId } = req.params;
    const app = await App.findById(appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const { version, title, releaseNotes, changelog, channel } = req.body;
    if (!version?.trim()) { res.status(400).json({ error: "Version is required" }); return; }

    // Check for duplicate version on same project
    const existing = await Release.findOne({ projectId: appId, version: version.trim() });
    if (existing) { res.status(409).json({ error: `Version ${version} already exists for this project` }); return; }

    const release = new Release({
      projectId: appId,
      version: version.trim(),
      title: title?.trim() || "",
      releaseNotes: releaseNotes?.trim() || "",
      changelog: changelog?.trim() || "",
      channel: channel || "stable",
      status: "draft",
    });

    await release.save();
    res.status(201).json({ release });
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ error: "Version already exists" }); return; }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/developer/apps/:appId/releases — List releases ─────────────────
router.get("/", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId } = req.params;
    const app = await App.findById(appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const releases = await Release.find({ projectId: appId }).sort({ createdAt: -1 });
    res.json({ releases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/developer/apps/:appId/releases/:releaseId ──────────────────────
router.get("/:releaseId", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId, releaseId } = req.params;
    const app = await App.findById(appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const release = await Release.findOne({ _id: releaseId, projectId: appId });
    if (!release) { res.status(404).json({ error: "Release not found" }); return; }

    res.json({ release });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/developer/apps/:appId/releases/:releaseId — Update release ──────
router.put("/:releaseId", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId, releaseId } = req.params;
    const app = await App.findById(appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const release = await Release.findOne({ _id: releaseId, projectId: appId });
    if (!release) { res.status(404).json({ error: "Release not found" }); return; }
    if (release.status === "published") { res.status(400).json({ error: "Cannot edit a published release" }); return; }

    const fields = ["version", "title", "releaseNotes", "changelog", "channel", "icon", "screenshots"];
    for (const f of fields) {
      if (req.body[f] !== undefined) (release as any)[f] = req.body[f];
    }

    await release.save();
    res.json({ release });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/developer/apps/:appId/releases/:releaseId/upload ──────────────
router.post(
  "/:releaseId/upload",
  requireDeveloper,
  upload.array("files", 10),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { appId, releaseId } = req.params;
      const app = await App.findById(appId);
      if (!app) { res.status(404).json({ error: "Project not found" }); return; }
      if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

      const release = await Release.findOne({ _id: releaseId, projectId: appId });
      if (!release) { res.status(404).json({ error: "Release not found" }); return; }
      if (!req.files || req.files.length === 0) { res.status(400).json({ error: "No files uploaded" }); return; }

      const uploadedFiles = (req.files as Express.Multer.File[]).map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        fileType: determineFileType(file.mimetype, file.originalname),
      }));

      release.files.push(...uploadedFiles);
      await release.save();

      res.json({ message: "Files uploaded to release", release });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ─── PUT /api/developer/apps/:appId/releases/:releaseId/publish ───────────────
router.put("/:releaseId/publish", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId, releaseId } = req.params;
    const app = await App.findById(appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const release = await Release.findOne({ _id: releaseId, projectId: appId });
    if (!release) { res.status(404).json({ error: "Release not found" }); return; }

    release.status = "published";
    release.publishedAt = new Date();
    await release.save();

    // Update project's current version and status
    app.currentVersion = release.version;
    if (app.status !== "published") {
      app.status = "published";
      app.visibility = "public";
      app.publishedAt = new Date();
    }
    if (release.icon) app.icon = release.icon;
    if (release.screenshots?.length > 0) app.screenshots = release.screenshots;

    await app.save();

    res.json({ release, app, publicUrl: `/apps/${app.slug}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── DELETE /api/developer/apps/:appId/releases/:releaseId ───────────────────
router.delete("/:releaseId", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appId, releaseId } = req.params;
    const app = await App.findById(appId);
    if (!app) { res.status(404).json({ error: "Project not found" }); return; }
    if (app.developerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }

    const release = await Release.findOne({ _id: releaseId, projectId: appId });
    if (!release) { res.status(404).json({ error: "Release not found" }); return; }
    if (release.status === "published") { res.status(400).json({ error: "Cannot delete a published release" }); return; }

    await Release.findByIdAndDelete(releaseId);
    res.json({ message: "Release deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
