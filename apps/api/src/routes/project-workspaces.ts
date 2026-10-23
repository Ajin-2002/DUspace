import crypto from "crypto";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import { AuthRequest, requireDeveloper } from "../middleware/auth";
import ProjectWorkspace, { IProjectWorkspace, WorkspaceSource, WorkspaceStatus } from "../models/ProjectWorkspace";
import ProjectWorkspaceFile from "../models/ProjectWorkspaceFile";
import ProjectWorkspaceImport from "../models/ProjectWorkspaceImport";
import ProjectAnalysisJob from "../models/ProjectAnalysisJob";
import ProjectAnalysisFinding from "../models/ProjectAnalysisFinding";
import ProjectAnalysisFile from "../models/ProjectAnalysisFile";
import ProjectBlueprint from "../models/ProjectBlueprint";
import {
  detectWorkspaceMetadata,
  extractProjectZip,
  normalizeProjectPath,
  ProjectImportError,
  PROJECT_IMPORT_LIMITS,
  storeFolderFiles,
} from "../utils/project-import";
import {
  newSnapshotKey,
  projectStorageRoot,
  removeImportStaging,
  removeProjectStorage,
  snapshotDirectory,
  stagingDirectory,
} from "../utils/private-project-storage";

const router = Router();
const ACTIVE_IMPORT_STATUSES: WorkspaceStatus[] = ["uploading", "validating", "extracting", "manifest", "saving"];
const MAX_CONCURRENT_IMPORTS = 2;
let activeImportCount = 0;
const requestBytes = new WeakMap<object, number>();
const uploadSourceTypes = new WeakMap<object, WorkspaceSource>();
const reservedUploadRequests = new WeakSet<object>();

function releaseUploadReservation(req: Request): void {
  if (!reservedUploadRequests.has(req)) return;
  reservedUploadRequests.delete(req);
  activeImportCount = Math.max(0, activeImportCount - 1);
}

function publicWorkspace(workspace: IProjectWorkspace) {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    description: workspace.description,
    sourceType: workspace.sourceType,
    status: workspace.status,
    framework: workspace.framework,
    language: workspace.language,
    fileCount: workspace.fileCount,
    totalSizeBytes: workspace.totalSizeBytes,
    lastImportErrorCode: workspace.get("lastImportErrorCode") as string | undefined,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

function projectIdFrom(req: Request): string | null {
  const id = req.params.projectId;
  return typeof id === "string" && mongoose.isValidObjectId(id) ? id : null;
}

function validSource(value: unknown): value is WorkspaceSource {
  return value === "zip" || value === "folder";
}

function safeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorResponse(res: Response, error: unknown): void {
  if (error instanceof ProjectImportError) {
    res.status(error.statusCode).json({ error: error.message, code: error.code });
    return;
  }
  if (error instanceof multer.MulterError) {
    const code = error.code === "LIMIT_FILE_SIZE" ? "UPLOAD_SIZE_LIMIT" : "INVALID_UPLOAD";
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "The upload exceeds the configured size limit."
      : "The upload contains too many or unexpected files.";
    res.status(400).json({ error: message, code });
    return;
  }
  console.error("Project workspace request failed", error);
  res.status(500).json({ error: "The project workspace request could not be completed.", code: "WORKSPACE_ERROR" });
}

async function findOwnedProject(req: AuthRequest, res: Response): Promise<IProjectWorkspace | null> {
  const id = projectIdFrom(req);
  if (!id) {
    res.status(400).json({ error: "Invalid project ID", code: "INVALID_PROJECT_ID" });
    return null;
  }
  const workspace = await ProjectWorkspace.findOne({ _id: id, ownerId: req.userId }).select("+lastImportErrorCode");
  if (!workspace) {
    res.status(404).json({ error: "Project not found", code: "PROJECT_NOT_FOUND" });
    return null;
  }
  return workspace;
}

function uploadStorage(): multer.StorageEngine {
  return {
    _handleFile(req, file, callback) {
      const authReq = req as AuthRequest;
      const projectId = projectIdFrom(req);
      const importId = typeof req.query.importId === "string" ? req.query.importId : "";
      if (!authReq.userId || !projectId || !mongoose.isValidObjectId(importId)) {
        callback(new ProjectImportError("INVALID_UPLOAD_SESSION", "The upload session is invalid."));
        return;
      }
      const folder = stagingDirectory(authReq.userId, projectId, importId);
      const filename = `${crypto.randomUUID()}.upload`;
      const filePath = path.join(folder, filename);
      const maxBytes = file.fieldname === "archive"
        ? PROJECT_IMPORT_LIMITS.archiveBytes
        : PROJECT_IMPORT_LIMITS.totalBytes;
      let size = 0;
      const limiter = new Transform({
        transform(chunk: Buffer, _encoding, done) {
          size += chunk.length;
          const requestTotal = (requestBytes.get(req) ?? 0) + chunk.length;
          const allowed = Math.min(maxBytes, file.fieldname === "archive" ? maxBytes : PROJECT_IMPORT_LIMITS.totalBytes);
          if (size > maxBytes || requestTotal > allowed) {
            done(new ProjectImportError("UPLOAD_SIZE_LIMIT", "The upload exceeds the configured size limit."));
            return;
          }
          requestBytes.set(req, requestTotal);
          done(null, chunk);
        },
      });

      void (async () => {
        try {
          await fs.mkdir(folder, { recursive: true, mode: 0o700 });
          await pipeline(file.stream, limiter, createWriteStream(filePath, { flags: "wx", mode: 0o600 }));
          callback(null, { destination: folder, filename, path: filePath, size });
        } catch (error) {
          await fs.rm(filePath, { force: true }).catch(() => undefined);
          callback(error as Error);
        }
      })();
    },
    _removeFile(_req, file, callback) {
      if (file.path) fs.rm(file.path, { force: true }).then(() => callback(null), callback);
      else callback(null);
    },
  };
}

const multipartUpload = multer({
  storage: uploadStorage(),
  limits: {
    fileSize: PROJECT_IMPORT_LIMITS.totalBytes,
    files: PROJECT_IMPORT_LIMITS.fileCount,
    fields: 1,
    fieldSize: 8 * 1024 * 1024,
  },
});

router.use(requireDeveloper);

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
    const sourceType = req.body?.sourceType;
    if (!name || name.length > 100 || description.length > 2000 || !validSource(sourceType)) {
      res.status(400).json({ error: "Provide a project name (up to 100 characters), description (up to 2,000 characters), and valid source type.", code: "INVALID_PROJECT" });
      return;
    }
    const workspace = await ProjectWorkspace.create({ ownerId: req.userId, name, description, sourceType });
    res.status(201).json({ project: publicWorkspace(workspace) });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "24"), 10) || 24));
    const filter: Record<string, unknown> = { ownerId: req.userId };
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      filter.name = { $regex: safeRegex(req.query.q.trim().slice(0, 100)), $options: "i" };
    }
    if (typeof req.query.status === "string" && req.query.status !== "all") {
      const statuses: WorkspaceStatus[] = ["created", "uploading", "validating", "extracting", "manifest", "saving", "ready", "failed", "deleting"];
      if (req.query.status === "active") {
        filter.status = { $in: ACTIVE_IMPORT_STATUSES };
      } else {
        if (!statuses.includes(req.query.status as WorkspaceStatus)) {
          res.status(400).json({ error: "Invalid status filter", code: "INVALID_STATUS" });
          return;
        }
        filter.status = req.query.status;
      }
    }
    const allowedSorts = { updated: { updatedAt: -1 as const }, name: { name: 1 as const }, created: { createdAt: -1 as const } };
    const sortName = typeof req.query.sort === "string" ? req.query.sort : "updated";
    if (!(sortName in allowedSorts)) {
      res.status(400).json({ error: "Invalid sort value", code: "INVALID_SORT" });
      return;
    }
    const sort = allowedSorts[sortName as keyof typeof allowedSorts];
    const ownerFilter = { ownerId: req.userId };
    const [documents, total, ownerTotal, ready, failed, active] = await Promise.all([
      ProjectWorkspace.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
      ProjectWorkspace.countDocuments(filter),
      ProjectWorkspace.countDocuments(ownerFilter),
      ProjectWorkspace.countDocuments({ ...ownerFilter, status: "ready" }),
      ProjectWorkspace.countDocuments({ ...ownerFilter, status: "failed" }),
      ProjectWorkspace.countDocuments({ ...ownerFilter, status: { $in: ACTIVE_IMPORT_STATUSES } }),
    ]);
    res.json({ projects: documents.map(publicWorkspace), counts: { total: ownerTotal, ready, failed, active }, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/:projectId", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await findOwnedProject(req, res);
    if (!workspace) return;
    res.json({ project: publicWorkspace(workspace) });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.patch("/:projectId", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await findOwnedProject(req, res);
    if (!workspace) return;
    const allowed = Object.keys(req.body ?? {}).filter((key) => key !== "name" && key !== "description");
    if (allowed.length) {
      res.status(400).json({ error: "Only project name and description can be updated.", code: "INVALID_PROJECT_FIELDS" });
      return;
    }
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim() || req.body.name.trim().length > 100) {
        res.status(400).json({ error: "Project name must be between 1 and 100 characters.", code: "INVALID_NAME" });
        return;
      }
      workspace.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) {
      if (typeof req.body.description !== "string" || req.body.description.trim().length > 2000) {
        res.status(400).json({ error: "Description must be at most 2,000 characters.", code: "INVALID_DESCRIPTION" });
        return;
      }
      workspace.description = req.body.description.trim();
    }
    await workspace.save();
    res.json({ project: publicWorkspace(workspace) });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.delete("/:projectId", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await findOwnedProject(req, res);
    if (!workspace) return;
    const activeImport = await ProjectWorkspaceImport.exists({ projectId: workspace._id, ownerId: workspace.ownerId, status: { $in: ACTIVE_IMPORT_STATUSES } });
    if (activeImport) {
      res.status(409).json({ error: "Wait for the current import to finish before deleting this project.", code: "IMPORT_IN_PROGRESS" });
      return;
    }
    const activeAnalysis = await ProjectAnalysisJob.exists({
      projectId: workspace._id,
      ownerId: workspace.ownerId,
      status: { $in: ["queued", "running"] },
    });
    if (activeAnalysis) {
      res.status(409).json({ error: "Wait for the current analysis to finish before deleting this project.", code: "ANALYSIS_IN_PROGRESS" });
      return;
    }
    const lockState = await ProjectWorkspace.findOne({ _id: workspace._id, ownerId: workspace.ownerId })
      .select("+activeAnalysisJobId +analysisLockAt");
    if (lockState?.activeAnalysisJobId) {
      const lockedJob = await ProjectAnalysisJob.findOne({
        _id: lockState.activeAnalysisJobId,
        ownerId: workspace.ownerId,
      }).select("status");
      const abandonedReservation = !lockedJob &&
        lockState.analysisLockAt &&
        Date.now() - lockState.analysisLockAt.getTime() > 120_000;
      if ((lockedJob && ["queued", "running"].includes(lockedJob.status)) || (!lockedJob && !abandonedReservation)) {
        res.status(409).json({
          error: lockedJob ? "Wait for the current analysis to finish before deleting this project." : "An analysis request is being prepared. Retry deletion shortly.",
          code: lockedJob ? "ANALYSIS_IN_PROGRESS" : "PROJECT_BUSY",
        });
        return;
      }
      await ProjectWorkspace.updateOne(
        { _id: workspace._id, ownerId: workspace.ownerId, activeAnalysisJobId: lockState.activeAnalysisJobId },
        { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
      );
    }
    const deleteClaim = await ProjectWorkspace.updateOne(
      {
        _id: workspace._id,
        ownerId: workspace.ownerId,
        status: workspace.status,
        activeAnalysisJobId: { $exists: false },
      },
      { $set: { status: "deleting" } },
    );
    if (deleteClaim.modifiedCount !== 1) {
      const stillActive = await ProjectAnalysisJob.exists({
        projectId: workspace._id,
        ownerId: workspace.ownerId,
        status: { $in: ["queued", "running"] },
      });
      res.status(409).json({
        error: stillActive ? "Wait for the current analysis to finish before deleting this project." : "The project is changing. Retry deletion shortly.",
        code: stillActive ? "ANALYSIS_IN_PROGRESS" : "PROJECT_BUSY",
      });
      return;
    }
    try {
      await removeProjectStorage(workspace.ownerId.toString(), workspace._id.toString());
    } catch {
      res.status(503).json({ error: "Project storage cleanup is temporarily unavailable. Retry deletion later.", code: "STORAGE_CLEANUP_FAILED" });
      return;
    }
    await ProjectWorkspaceFile.deleteMany({ projectId: workspace._id, ownerId: workspace.ownerId });
    await ProjectWorkspaceImport.deleteMany({ projectId: workspace._id, ownerId: workspace.ownerId });
    await ProjectAnalysisFinding.deleteMany({ projectId: workspace._id, ownerId: workspace.ownerId });
    await ProjectAnalysisFile.deleteMany({ projectId: workspace._id, ownerId: workspace.ownerId });
    await ProjectBlueprint.deleteMany({ projectId: workspace._id, ownerId: workspace.ownerId });
    await ProjectAnalysisJob.deleteMany({ projectId: workspace._id, ownerId: workspace.ownerId });
    await workspace.deleteOne();
    res.json({ deleted: true });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/:projectId/uploads", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await findOwnedProject(req, res);
    if (!workspace) return;
    if (workspace.status === "ready") {
      res.status(409).json({ error: "This project already has an imported source snapshot.", code: "PROJECT_ALREADY_IMPORTED" });
      return;
    }
    if (!(["created", "failed"] as WorkspaceStatus[]).includes(workspace.status)) {
      res.status(409).json({ error: "An import is already in progress.", code: "IMPORT_IN_PROGRESS" });
      return;
    }
    const sourceType = req.body?.sourceType;
    const originalFilename = req.body?.originalFilename;
    if (sourceType !== workspace.sourceType || (sourceType === "zip" && (typeof originalFilename !== "string" || !originalFilename.toLowerCase().endsWith(".zip")))) {
      res.status(400).json({ error: "The upload type does not match this project.", code: "INVALID_UPLOAD_TYPE" });
      return;
    }
    const importRecord = await ProjectWorkspaceImport.create({
      projectId: workspace._id,
      ownerId: workspace.ownerId,
      sourceType,
      status: "uploading",
      progressStage: "Preparing files",
      originalFilename: sourceType === "zip" ? path.basename(originalFilename.replace(/\\/g, "/")).slice(0, 255) : undefined,
    });
    const claimed = await ProjectWorkspace.updateOne(
      { _id: workspace._id, ownerId: workspace.ownerId, status: { $in: ["created", "failed"] } },
      { $set: { latestImportId: importRecord._id, status: "uploading" }, $unset: { lastImportErrorCode: 1 } },
    );
    if (claimed.modifiedCount !== 1) {
      await importRecord.deleteOne();
      res.status(409).json({ error: "This project is already importing or has already been imported.", code: "IMPORT_IN_PROGRESS" });
      return;
    }
    res.status(201).json({ importId: importRecord._id.toString(), status: importRecord.status, progressStage: importRecord.progressStage });
  } catch (error) {
    errorResponse(res, error);
  }
});

async function validateUploadSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await findOwnedProject(req, res);
    if (!workspace) return;
    const importId = typeof req.query.importId === "string" ? req.query.importId : "";
    if (!mongoose.isValidObjectId(importId)) {
      res.status(400).json({ error: "Invalid upload session", code: "INVALID_UPLOAD_SESSION" });
      return;
    }
    const importRecord = await ProjectWorkspaceImport.findOne({ _id: importId, projectId: workspace._id, ownerId: workspace.ownerId });
    if (!importRecord) {
      res.status(404).json({ error: "Upload session not found", code: "UPLOAD_SESSION_NOT_FOUND" });
      return;
    }
    if (importRecord.status === "ready" || (workspace.status === "ready" && workspace.latestImportId?.toString() === importId)) {
      res.json({ project: publicWorkspace(workspace), importId, status: "ready", progressStage: "Import complete" });
      return;
    }
    if (importRecord.status !== "uploading" || importRecord.finalizationStarted) {
      res.status(409).json({ error: "This upload session can no longer receive files.", code: "UPLOAD_SESSION_CLOSED" });
      return;
    }
    if (!validSource(importRecord.sourceType) || workspace.sourceType !== importRecord.sourceType) {
      res.status(400).json({ error: "Upload type does not match the project.", code: "INVALID_UPLOAD_TYPE" });
      return;
    }
    if (activeImportCount >= MAX_CONCURRENT_IMPORTS) {
      res.status(503).json({ error: "Imports are busy. Retry this upload shortly.", code: "IMPORT_CAPACITY" });
      return;
    }
    const claimed = await ProjectWorkspaceImport.findOneAndUpdate(
      { _id: importId, projectId: workspace._id, ownerId: workspace.ownerId, status: "uploading", finalizationStarted: false },
      { $set: { finalizationStarted: true, progressStage: "Uploading files" } },
      { returnDocument: "after" },
    );
    if (!claimed) {
      res.status(409).json({ error: "This upload session is already being finalized.", code: "IMPORT_IN_PROGRESS" });
      return;
    }
    activeImportCount += 1;
    reservedUploadRequests.add(req);
    uploadSourceTypes.set(req, claimed.sourceType);
    next();
  } catch (error) {
    errorResponse(res, error);
  }
}

router.post("/:projectId/uploads/complete", validateUploadSession, (req, res, next) => {
  const importId = typeof req.query.importId === "string" ? req.query.importId : "";
  const field = uploadSourceTypes.get(req) === "folder" ? "files" : "archive";
  const upload = field === "archive" ? multipartUpload.single("archive") : multipartUpload.array("files", PROJECT_IMPORT_LIMITS.fileCount);
  upload(req, res, (error?: unknown) => {
    if (!error) {
      next();
      return;
    }
    const ownerId = (req as AuthRequest).userId;
    const projectId = projectIdFrom(req) ?? "";
    void Promise.allSettled([
      ownerId ? removeImportStaging(ownerId, projectId, importId).catch(() => undefined) : Promise.resolve(),
      ProjectWorkspaceImport.updateOne(
        { _id: importId, projectId, ownerId, status: "uploading" },
        { $set: { status: "failed", progressStage: "Import failed", errorCode: error instanceof ProjectImportError ? error.code : "INVALID_UPLOAD", completedAt: new Date() } },
      ),
      ProjectWorkspace.updateOne({ _id: projectId, ownerId, status: "uploading" }, { $set: { status: "failed", lastImportErrorCode: error instanceof ProjectImportError ? error.code : "INVALID_UPLOAD" } }),
    ]).then(() => {
      releaseUploadReservation(req);
      next(error);
    });
  });
}, async (req: AuthRequest, res: Response) => {
  const importId = typeof req.query.importId === "string" ? req.query.importId : "";
  const projectId = projectIdFrom(req);
  if (!projectId) {
    res.status(400).json({ error: "Invalid project ID", code: "INVALID_PROJECT_ID" });
    return;
  }
  const ownerId = req.userId as string;
  let snapshotPath: string | undefined;
  let snapshotKey: string | undefined;
  let importRecord = await ProjectWorkspaceImport.findOne({ _id: importId, projectId, ownerId });
  let workspace = await ProjectWorkspace.findOne({ _id: projectId, ownerId });
  if (!importRecord || !workspace) {
    await removeImportStaging(ownerId, projectId, importId).catch(() => undefined);
    releaseUploadReservation(req);
    res.status(404).json({ error: "Project or upload session not found", code: "UPLOAD_SESSION_NOT_FOUND" });
    return;
  }

  if (importRecord.status === "ready") {
    releaseUploadReservation(req);
    res.json({ project: publicWorkspace(workspace), importId, status: "ready", progressStage: "Import complete" });
    return;
  }
  if (importRecord.status !== "uploading") {
    releaseUploadReservation(req);
    res.status(409).json({ error: "This upload is already being processed.", code: "IMPORT_IN_PROGRESS" });
    return;
  }
  requestBytes.delete(req);
  try {
    const sourceType = importRecord.sourceType;
    const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
    if (sourceType === "zip" && (files.length !== 1 || files[0].fieldname !== "archive")) {
      throw new ProjectImportError("INVALID_UPLOAD", "Choose one ZIP archive to import.");
    }
    if (sourceType === "folder" && (!files.length || files.some((file) => file.fieldname !== "files"))) {
      throw new ProjectImportError("INVALID_UPLOAD", "The selected folder did not contain any files.");
    }

    const relativePaths = sourceType === "folder" ? parseRelativePaths(req.body?.relativePaths, files.length) : [];
    let uploadBytes = 0;
    for (const file of files) uploadBytes += file.size;
    importRecord.status = "validating";
    importRecord.progressStage = "Validating archive";
    importRecord.uploadBytes = uploadBytes;
    await importRecord.save();
    workspace.status = "validating";
    await workspace.save();

    snapshotKey = newSnapshotKey();
    importRecord.snapshotKey = snapshotKey;
    await importRecord.save();
    snapshotPath = snapshotDirectory(ownerId, projectId, snapshotKey);
    const storagePrefix = path.posix.join(ownerId, projectId, "original", snapshotKey);
    let manifest;
    if (sourceType === "zip") {
      const zipFile = files[0];
      if (zipFile.size > PROJECT_IMPORT_LIMITS.archiveBytes || !zipFile.originalname.toLowerCase().endsWith(".zip")) {
        throw new ProjectImportError("INVALID_ARCHIVE", "Choose a valid ZIP archive within the configured size limit.");
      }
      importRecord.status = "extracting";
      importRecord.progressStage = "Extracting files";
      workspace.status = "extracting";
      await Promise.all([importRecord.save(), workspace.save()]);
      manifest = await extractProjectZip(zipFile.path, snapshotPath, storagePrefix);
    } else {
      if (files.length > PROJECT_IMPORT_LIMITS.fileCount) {
        throw new ProjectImportError("TOO_MANY_FILES", "The folder contains too many files.");
      }
      importRecord.status = "extracting";
      importRecord.progressStage = "Storing selected files";
      workspace.status = "extracting";
      await Promise.all([importRecord.save(), workspace.save()]);
      const stagedFiles = files.map((file, index) => ({ path: file.path, relativePath: relativePaths[index], size: file.size }));
      manifest = await storeFolderFiles(stagedFiles, snapshotPath, storagePrefix);
    }

    importRecord.status = "manifest";
    importRecord.progressStage = "Creating project manifest";
    importRecord.extractedBytes = manifest.reduce((total, file) => total + file.size, 0);
    importRecord.fileCount = manifest.length;
    workspace.status = "manifest";
    await Promise.all([importRecord.save(), workspace.save()]);

    importRecord.status = "saving";
    importRecord.progressStage = "Saving project";
    workspace.status = "saving";
    await Promise.all([importRecord.save(), workspace.save()]);
    await ProjectWorkspaceFile.deleteMany({ projectId, ownerId });
    await ProjectWorkspaceFile.insertMany(manifest.map((file) => ({ ...file, projectId, ownerId })));
    const metadata = detectWorkspaceMetadata(manifest.map((file) => file.relativePath));
    workspace.status = "ready";
    workspace.originalSnapshotKey = snapshotKey;
    workspace.fileCount = manifest.length;
    workspace.totalSizeBytes = importRecord.extractedBytes;
    workspace.framework = metadata.framework;
    workspace.language = metadata.language;
    workspace.lastImportErrorCode = undefined;
    await workspace.save();
    importRecord.status = "ready";
    importRecord.progressStage = "Import complete";
    importRecord.completedAt = new Date();
    await importRecord.save();
    await removeImportStaging(ownerId, projectId, importId);
    res.json({ project: publicWorkspace(workspace), importId, status: importRecord.status, progressStage: importRecord.progressStage });
  } catch (error) {
    if (snapshotPath) await fs.rm(snapshotPath, { recursive: true, force: true }).catch(() => undefined);
    await ProjectWorkspaceFile.deleteMany({ projectId, ownerId }).catch(() => undefined);
    await removeImportStaging(ownerId, projectId, importId).catch(() => undefined);
    if (importRecord) {
      importRecord.status = "failed";
      importRecord.progressStage = "Import failed";
      importRecord.errorCode = error instanceof ProjectImportError ? error.code : "IMPORT_FAILED";
      importRecord.completedAt = new Date();
      await importRecord.save().catch(() => undefined);
    }
    if (workspace) {
      workspace.status = "failed";
      workspace.lastImportErrorCode = error instanceof ProjectImportError ? error.code : "IMPORT_FAILED";
      await workspace.save().catch(() => undefined);
    }
    errorResponse(res, error);
  } finally {
    releaseUploadReservation(req);
  }
});

function parseRelativePaths(value: unknown, fileCount: number): string[] {
  if (typeof value !== "string" || value.length > 8 * 1024 * 1024) {
    throw new ProjectImportError("INVALID_FOLDER_MANIFEST", "The folder file list is missing or invalid.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new ProjectImportError("INVALID_FOLDER_MANIFEST", "The folder file list is malformed.");
  }
  if (!Array.isArray(parsed) || parsed.length !== fileCount || parsed.some((item) => typeof item !== "string")) {
    throw new ProjectImportError("INVALID_FOLDER_MANIFEST", "The folder file list does not match the uploaded files.");
  }
  return parsed.map((item) => normalizeProjectPath(item as string));
}

router.get("/:projectId/import-status", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await findOwnedProject(req, res);
    if (!workspace) return;
    const importRecord = workspace.latestImportId
      ? await ProjectWorkspaceImport.findOne({ _id: workspace.latestImportId, projectId: workspace._id, ownerId: workspace.ownerId })
      : null;
    res.json({
      projectId: workspace._id.toString(),
      status: workspace.status,
      progressStage: workspace.status === "ready" ? "Import complete" : importRecord?.progressStage ?? workspace.status,
      errorCode: importRecord?.errorCode ?? (workspace.get("lastImportErrorCode") as string | undefined),
      fileCount: workspace.fileCount,
      totalSizeBytes: workspace.totalSizeBytes,
    });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.get("/:projectId/files", async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await findOwnedProject(req, res);
    if (!workspace) return;
    if (workspace.status !== "ready") {
      res.status(409).json({ error: "The project file manifest is not ready yet.", code: "PROJECT_NOT_READY" });
      return;
    }
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(500, Math.max(1, Number.parseInt(String(req.query.limit ?? "250"), 10) || 250));
    const [files, total] = await Promise.all([
      ProjectWorkspaceFile.find({ projectId: workspace._id, ownerId: workspace.ownerId }).select("relativePath size mimeType sha256").sort({ relativePath: 1 }).skip((page - 1) * limit).limit(limit),
      ProjectWorkspaceFile.countDocuments({ projectId: workspace._id, ownerId: workspace.ownerId }),
    ]);
    res.json({ files: files.map((file) => ({ path: file.relativePath, size: file.size, mimeType: file.mimeType, sha256: file.sha256 })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    errorResponse(res, error);
  }
});

router.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  releaseUploadReservation(req);
  errorResponse(res, error);
});

export async function recoverAbandonedProjectImports(): Promise<void> {
  const stale = await ProjectWorkspaceImport.find({ status: { $in: ACTIVE_IMPORT_STATUSES } }).select("+snapshotKey");
  for (const importRecord of stale) {
    const ownerId = importRecord.ownerId.toString();
    const projectId = importRecord.projectId.toString();
    const workspace = await ProjectWorkspace.findOne({ _id: importRecord.projectId, ownerId: importRecord.ownerId }).select("+originalSnapshotKey");
    if (workspace?.status === "ready" && workspace.originalSnapshotKey) {
      importRecord.status = "ready";
      importRecord.progressStage = "Import complete";
      importRecord.completedAt = importRecord.completedAt ?? new Date();
      await importRecord.save();
      continue;
    }
    await removeImportStaging(ownerId, projectId, importRecord._id.toString()).catch(() => undefined);
    if (importRecord.snapshotKey) {
      await fs.rm(snapshotDirectory(ownerId, projectId, importRecord.snapshotKey), { recursive: true, force: true }).catch(() => undefined);
    }
    await ProjectWorkspaceFile.deleteMany({ projectId: importRecord.projectId, ownerId: importRecord.ownerId });
    importRecord.status = "failed";
    importRecord.progressStage = "Import failed";
    importRecord.errorCode = "IMPORT_INTERRUPTED";
    importRecord.completedAt = new Date();
    await importRecord.save();
    await ProjectWorkspace.updateOne(
      { _id: importRecord.projectId, ownerId: importRecord.ownerId, latestImportId: importRecord._id },
      { $set: { status: "failed", lastImportErrorCode: "IMPORT_INTERRUPTED" } },
    );
  }
  await fs.mkdir(projectStorageRoot, { recursive: true, mode: 0o700 });
}

export default router;
