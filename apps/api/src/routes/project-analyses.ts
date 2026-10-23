import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { AuthRequest, requireDeveloper } from "../middleware/auth";
import ProjectWorkspace from "../models/ProjectWorkspace";
import ProjectWorkspaceImport from "../models/ProjectWorkspaceImport";
import ProjectAnalysisJob, { IProjectAnalysisJob } from "../models/ProjectAnalysisJob";
import ProjectAnalysisFinding from "../models/ProjectAnalysisFinding";
import ProjectAnalysisFile from "../models/ProjectAnalysisFile";
import ProjectBlueprint from "../models/ProjectBlueprint";
import { validateBlueprintShape } from "../utils/project-analyzer";

const projectRouter = Router();
const analysisRouter = Router();

function validId(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

function jobJson(job: IProjectAnalysisJob) {
  return {
    id: job._id.toString(),
    projectId: job.projectId.toString(),
    status: job.status,
    currentStage: job.currentStage,
    progress: job.progress,
    attemptCount: job.attemptCount,
    analysisVersion: job.analysisVersion,
    cancelRequested: job.cancelRequested,
    errorCode: job.errorCode,
    error: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  };
}

function errorResponse(res: Response, code: string, message: string, status = 400): void {
  res.status(status).json({ error: message, code });
}

async function ownedJob(req: Request, res: Response): Promise<IProjectAnalysisJob | null> {
  if (!validId(req.params.analysisId)) {
    errorResponse(res, "INVALID_ANALYSIS_ID", "Invalid analysis ID.");
    return null;
  }
  const job = await ProjectAnalysisJob.findOne({ _id: req.params.analysisId, ownerId: (req as AuthRequest).userId });
  if (!job) {
    errorResponse(res, "ANALYSIS_NOT_FOUND", "Analysis not found.", 404);
    return null;
  }
  return job;
}

async function ensureImportedProject(projectId: string, ownerId: string, res: Response) {
  const project = await ProjectWorkspace.findOne({ _id: projectId, ownerId, status: "ready" }).select("+originalSnapshotKey");
  if (!project || !project.originalSnapshotKey || !project.latestImportId) {
    errorResponse(res, "PROJECT_NOT_READY", "Import the project successfully before analysis.", 409);
    return null;
  }
  const importRecord = await ProjectWorkspaceImport.findOne({
    _id: project.latestImportId,
    projectId: project._id,
    ownerId,
    status: "ready",
  }).select("+snapshotKey");
  if (!importRecord || importRecord.snapshotKey !== project.originalSnapshotKey) {
    errorResponse(res, "PROJECT_NOT_READY", "The imported project snapshot is unavailable.", 409);
    return null;
  }
  return project;
}

async function createJob(projectId: mongoose.Types.ObjectId, ownerId: string, res: Response) {
  const workspace = await ProjectWorkspace.findOne({
    _id: projectId, ownerId, status: "ready",
  }).select("+activeAnalysisJobId +analysisLockAt");
  if (!workspace) {
    errorResponse(res, "PROJECT_NOT_READY", "Import the project successfully before analysis.", 409);
    return null;
  }
  if (workspace.activeAnalysisJobId) {
    const lockedJob = await ProjectAnalysisJob.findOne({
      _id: workspace.activeAnalysisJobId,
      ownerId,
    }).select("status");
    const lockExpired = workspace.analysisLockAt && Date.now() - workspace.analysisLockAt.getTime() > 120_000;
    if (lockedJob && ["queued", "running"].includes(lockedJob.status)) {
      errorResponse(res, "ANALYSIS_ALREADY_ACTIVE", "An analysis is already queued or running.", 409);
      return null;
    }
    if (!lockedJob && !lockExpired) {
      errorResponse(res, "ANALYSIS_ALREADY_ACTIVE", "An analysis request is being prepared. Retry shortly.", 409);
      return null;
    }
    await ProjectWorkspace.updateOne(
      { _id: projectId, ownerId, activeAnalysisJobId: workspace.activeAnalysisJobId },
      { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
    );
  }
  const existing = await ProjectAnalysisJob.findOne({
    projectId, ownerId, status: { $in: ["queued", "running"] },
  }).sort({ createdAt: -1 });
  if (existing) {
    errorResponse(res, "ANALYSIS_ALREADY_ACTIVE", "An analysis is already queued or running.", 409);
    return null;
  }
  const previous = await ProjectAnalysisJob.findOne({ projectId, ownerId }).sort({ analysisVersion: -1 }).select("analysisVersion");
  const analysisVersion = (previous?.analysisVersion ?? 0) + 1;
  const analysisId = new mongoose.Types.ObjectId();
  const reservation = await ProjectWorkspace.findOneAndUpdate(
    { _id: projectId, ownerId, status: "ready", activeAnalysisJobId: { $exists: false } },
    { $set: { activeAnalysisJobId: analysisId, analysisLockAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!reservation) {
    errorResponse(res, "ANALYSIS_ALREADY_ACTIVE", "The project is changing or an analysis is already queued.", 409);
    return null;
  }
  try {
    return await ProjectAnalysisJob.create({
      _id: analysisId,
      projectId,
      ownerId,
      status: "queued",
      currentStage: "queued",
      progress: 0,
      attemptCount: 0,
      analysisVersion,
      activeKey: ownerId + ":" + projectId.toString(),
    });
  } catch (error) {
    await ProjectWorkspace.updateOne(
      { _id: projectId, ownerId, activeAnalysisJobId: analysisId },
      { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
    ).catch(() => undefined);
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      errorResponse(res, "ANALYSIS_ALREADY_ACTIVE", "An analysis is already queued or running.", 409);
      return null;
    }
    throw error;
  }
}

projectRouter.use(requireDeveloper);
analysisRouter.use(requireDeveloper);

projectRouter.post("/:projectId/analyses", async (req: AuthRequest, res: Response) => {
  try {
    if (!validId(req.params.projectId)) {
      errorResponse(res, "INVALID_PROJECT_ID", "Invalid project ID.");
      return;
    }
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length) {
      errorResponse(res, "INVALID_REQUEST", "Analysis requests do not accept a payload.");
      return;
    }
    const project = await ensureImportedProject(req.params.projectId, req.userId!, res);
    if (!project) return;
    const job = await createJob(project._id, req.userId!, res);
    if (!job) return;
    res.status(202).json({ job: jobJson(job) });
  } catch {
    errorResponse(res, "ANALYSIS_QUEUE_ERROR", "The analysis could not be queued. Retry shortly.", 500);
  }
});

projectRouter.get("/:projectId/analyses", async (req: AuthRequest, res: Response) => {
  try {
    if (!validId(req.params.projectId)) {
      errorResponse(res, "INVALID_PROJECT_ID", "Invalid project ID.");
      return;
    }
    const project = await ProjectWorkspace.exists({ _id: req.params.projectId, ownerId: req.userId });
    if (!project) {
      errorResponse(res, "PROJECT_NOT_FOUND", "Project not found.", 404);
      return;
    }
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const filter = { projectId: new mongoose.Types.ObjectId(req.params.projectId), ownerId: req.userId };
    const [jobs, total] = await Promise.all([
      ProjectAnalysisJob.find(filter).sort({ analysisVersion: -1 }).skip((page - 1) * limit).limit(limit),
      ProjectAnalysisJob.countDocuments(filter),
    ]);
    res.json({
      jobs: jobs.map(jobJson),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch {
    errorResponse(res, "ANALYSIS_LIST_ERROR", "Analysis history could not be loaded.", 500);
  }
});

analysisRouter.get("/:analysisId", async (req: Request, res: Response) => {
  try {
    const job = await ownedJob(req, res);
    if (job) res.json({ job: jobJson(job) });
  } catch {
    errorResponse(res, "ANALYSIS_STATUS_ERROR", "Analysis status could not be loaded.", 500);
  }
});

analysisRouter.get("/:analysisId/report", async (req: Request, res: Response) => {
  try {
    const job = await ownedJob(req, res);
    if (!job) return;
    if (job.status !== "completed") {
      errorResponse(res, "REPORT_NOT_READY", "The analysis report is not ready yet.", 409);
      return;
    }
    const record = await ProjectBlueprint.findOne({
      projectId: job.projectId,
      ownerId: job.ownerId,
      analysisJobId: job._id,
      analysisVersion: job.analysisVersion,
      schemaVersion: 1,
    });
    if (!record || !validateBlueprintShape(record.blueprint)) {
      errorResponse(res, "REPORT_UNAVAILABLE", "The saved analysis report could not be validated.", 500);
      return;
    }
    res.json({ report: record.blueprint, generatedAt: record.generatedAt });
  } catch {
    errorResponse(res, "REPORT_ERROR", "The analysis report could not be loaded.", 500);
  }
});

analysisRouter.get("/:analysisId/findings", async (req: Request, res: Response) => {
  try {
    const job = await ownedJob(req, res);
    if (!job) return;
    const allowedSeverity = ["critical", "high", "medium", "low", "info"];
    const allowedCategory = ["security", "quality", "configuration", "dependency"];
    const severity = typeof req.query.severity === "string" ? req.query.severity : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    if ((severity && !allowedSeverity.includes(severity)) || (category && !allowedCategory.includes(category))) {
      errorResponse(res, "INVALID_FINDING_FILTER", "The finding filter is invalid.");
      return;
    }
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "25"), 10) || 25));
    const filter: Record<string, unknown> = {
      analysisJobId: job._id,
      ownerId: job.ownerId,
      projectId: job.projectId,
    };
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    const [findings, total] = await Promise.all([
      ProjectAnalysisFinding.find(filter).sort({ severity: 1, createdAt: -1 })
        .select("category severity title description fileReference lineStart lineEnd evidenceType confidence remediation status createdAt")
        .skip((page - 1) * limit).limit(limit),
      ProjectAnalysisFinding.countDocuments(filter),
    ]);
    res.json({ findings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    errorResponse(res, "FINDINGS_ERROR", "Analysis findings could not be loaded.", 500);
  }
});

analysisRouter.get("/:analysisId/files", async (req: Request, res: Response) => {
  try {
    const job = await ownedJob(req, res);
    if (!job) return;
    const allowedCategories = ["source", "configuration", "test", "documentation", "asset", "other"];
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    if (category && !allowedCategories.includes(category)) {
      errorResponse(res, "INVALID_FILE_FILTER", "The file category filter is invalid.");
      return;
    }
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "50"), 10) || 50));
    const filter: Record<string, unknown> = {
      analysisJobId: job._id,
      ownerId: job.ownerId,
      projectId: job.projectId,
    };
    if (category) filter.category = category;
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      const query = req.query.q.trim().slice(0, 100).replace(/[.*+?^{}()|[\]\\$]/g, "\\$&");
      filter.path = { $regex: query, $options: "i" };
    }
    const [files, total] = await Promise.all([
      ProjectAnalysisFile.find(filter).sort({ path: 1 })
        .select("path extension category size sha256 parseStatus")
        .skip((page - 1) * limit).limit(limit),
      ProjectAnalysisFile.countDocuments(filter),
    ]);
    res.json({ files, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    errorResponse(res, "ANALYSIS_FILES_ERROR", "The analysis inventory could not be loaded.", 500);
  }
});

analysisRouter.post("/:analysisId/cancel", async (req: Request, res: Response) => {
  try {
    const job = await ownedJob(req, res);
    if (!job) return;
    if (job.status === "queued") {
      const updated = await ProjectAnalysisJob.findOneAndUpdate(
        { _id: job._id, ownerId: job.ownerId, status: "queued" },
        { $set: { status: "cancelled", currentStage: "cancelled", completedAt: new Date() }, $unset: { activeKey: 1 } },
        { returnDocument: "after" },
      );
      if (updated) {
        await ProjectWorkspace.updateOne(
          { _id: job.projectId, ownerId: job.ownerId, activeAnalysisJobId: job._id },
          { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
        );
        res.json({ job: jobJson(updated) });
        return;
      }
    }
    if (job.status === "running") {
      const updated = await ProjectAnalysisJob.findOneAndUpdate(
        { _id: job._id, ownerId: job.ownerId, status: "running" },
        { $set: { cancelRequested: true } },
        { returnDocument: "after" },
      );
      if (updated) {
        res.json({ job: jobJson(updated), cancelRequested: true });
        return;
      }
    }
    errorResponse(res, "ANALYSIS_NOT_CANCELLABLE", "This analysis is already complete or cannot be cancelled.", 409);
  } catch {
    errorResponse(res, "ANALYSIS_CANCEL_ERROR", "The cancellation request could not be completed.", 500);
  }
});

analysisRouter.post("/:analysisId/retry", async (req: Request, res: Response) => {
  try {
    const job = await ownedJob(req, res);
    if (!job) return;
    if (!["failed", "cancelled"].includes(job.status)) {
      errorResponse(res, "ANALYSIS_NOT_RETRYABLE", "Only failed or cancelled analyses can be retried.", 409);
      return;
    }
    const project = await ensureImportedProject(job.projectId.toString(), job.ownerId.toString(), res);
    if (!project) return;
    const newJob = await createJob(project._id, job.ownerId.toString(), res);
    if (newJob) res.status(202).json({ job: jobJson(newJob) });
  } catch {
    errorResponse(res, "ANALYSIS_RETRY_ERROR", "The analysis could not be retried. Retry shortly.", 500);
  }
});

export const projectAnalysesRouter = projectRouter;
export const analysesRouter = analysisRouter;
