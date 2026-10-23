import crypto from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import ProjectWorkspace from "../models/ProjectWorkspace";
import ProjectWorkspaceFile from "../models/ProjectWorkspaceFile";
import ProjectWorkspaceImport from "../models/ProjectWorkspaceImport";
import ProjectAnalysisJob, { AnalysisStage } from "../models/ProjectAnalysisJob";
import ProjectAnalysisFinding from "../models/ProjectAnalysisFinding";
import ProjectAnalysisFile from "../models/ProjectAnalysisFile";
import ProjectBlueprint from "../models/ProjectBlueprint";
import { PROJECT_IMPORT_LIMITS, isExcludedProjectPath, normalizeProjectPath } from "./project-import";
import { snapshotDirectory } from "./private-project-storage";
import { analyzeProject, AnalysisInputFile, validateBlueprintShape } from "./project-analyzer";

const MAX_SOURCE_PARSE_BYTES = positiveInteger("ANALYSIS_MAX_SOURCE_MB", 20) * 1024 * 1024;
const MAX_FILE_PARSE_BYTES = 512 * 1024;
const MAX_ANALYSIS_MS = positiveInteger("ANALYSIS_TIMEOUT_SECONDS", 180) * 1000;
const PROGRESS_SPANS: Partial<Record<AnalysisStage, [number, number]>> = {
  validating: [0, 8], inventory: [8, 18], framework_detection: [26, 8], dependency_analysis: [34, 10],
  source_analysis: [44, 18], architecture_analysis: [62, 12], ui_analysis: [74, 12],
  quality_checks: [86, 10], blueprint_generation: [96, 3],
};

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export class ProjectAnalysisError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "ProjectAnalysisError";
  }
}

function throwIfCancelled(): never {
  throw new ProjectAnalysisError("ANALYSIS_CANCELLED", "Analysis was cancelled.");
}

function safeProjectPath(root: string, relativePath: string): string {
  const normalized = normalizeProjectPath(relativePath);
  if (normalized !== relativePath || isExcludedProjectPath(normalized)) {
    throw new ProjectAnalysisError("INVALID_MANIFEST", "The project manifest failed validation.");
  }
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(resolvedRoot, ...normalized.split("/"));
  if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
    throw new ProjectAnalysisError("INVALID_MANIFEST", "The project manifest failed validation.");
  }
  return resolvedFile;
}

async function hashAndRead(
  absolutePath: string,
  snapshotRoot: string,
  readContent: boolean,
  checkActive: () => Promise<void>,
): Promise<{ size: number; hash: string; content?: string }> {
  const rootRealPath = await fsPromises.realpath(snapshotRoot);
  const fileStat = await fsPromises.lstat(absolutePath);
  if (!fileStat.isFile() || fileStat.isSymbolicLink() || fileStat.size > PROJECT_IMPORT_LIMITS.totalBytes) {
    throw new ProjectAnalysisError("INVALID_SNAPSHOT", "A project source file failed integrity checks.");
  }
  const actualRealPath = await fsPromises.realpath(absolutePath);
  if (!actualRealPath.startsWith(rootRealPath + path.sep)) {
    throw new ProjectAnalysisError("INVALID_SNAPSHOT", "A project source file failed integrity checks.");
  }
  const digest = crypto.createHash("sha256");
  let checkedBytes = 0;
  let readBytes = 0;
  for await (const chunk of fs.createReadStream(actualRealPath)) {
    const data = chunk as Buffer;
    digest.update(data);
    readBytes += data.length;
    if (readBytes > PROJECT_IMPORT_LIMITS.totalBytes) {
      throw new ProjectAnalysisError("ANALYSIS_LIMIT", "The project exceeds the analysis resource limits.");
    }
    checkedBytes += data.length;
    if (checkedBytes >= 16 * 1024 * 1024) {
      await checkActive();
      checkedBytes = 0;
    }
  }
  if (readBytes !== fileStat.size) throw new ProjectAnalysisError("SNAPSHOT_INTEGRITY", "A project source file failed integrity checks.");
  let content: string | undefined;
  if (readContent && fileStat.size <= MAX_FILE_PARSE_BYTES) {
    const buffer = await fsPromises.readFile(actualRealPath);
    if (!buffer.includes(0)) content = buffer.toString("utf8");
  }
  return { size: fileStat.size, hash: digest.digest("hex"), content };
}

function needsText(filePath: string): boolean {
  return /\.(?:[cm]?[jt]sx?|vue|html|css|scss|sass|less|py|php|go|rs|java|kt|rb|sql|prisma)$/i.test(filePath) ||
    /(?:^|\/)(package\.json|package-lock\.json|composer\.json|requirements\.txt|pyproject\.toml|cargo\.toml|go\.mod|\.env(?:\.[^/]*)?|\.nvmrc|\.node-version|\.python-version)$/i.test(filePath);
}

async function loadSnapshot(
  jobId: mongoose.Types.ObjectId,
  onProgress: (completed: number, total: number) => Promise<void>,
  checkActive: () => Promise<void>,
): Promise<{
  files: AnalysisInputFile[];
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
}> {
  const job = await ProjectAnalysisJob.findOne({ _id: jobId, status: "running" });
  if (!job) throw new ProjectAnalysisError("ANALYSIS_NOT_FOUND", "Analysis job is no longer available.");
  const project = await ProjectWorkspace.findOne({
    _id: job.projectId,
    ownerId: job.ownerId,
    status: "ready",
  }).select("+originalSnapshotKey");
  if (!project || !project.originalSnapshotKey || !project.latestImportId) {
    throw new ProjectAnalysisError("PROJECT_NOT_READY", "The imported project snapshot is unavailable.");
  }
  const importRecord = await ProjectWorkspaceImport.findOne({
    _id: project.latestImportId,
    projectId: project._id,
    ownerId: project.ownerId,
    status: "ready",
  }).select("+snapshotKey");
  if (!importRecord || importRecord.snapshotKey !== project.originalSnapshotKey) {
    throw new ProjectAnalysisError("PROJECT_NOT_READY", "The imported project snapshot is unavailable.");
  }
  if (project.fileCount > PROJECT_IMPORT_LIMITS.fileCount ||
    project.totalSizeBytes > PROJECT_IMPORT_LIMITS.totalBytes) {
    throw new ProjectAnalysisError("ANALYSIS_LIMIT", "The project exceeds the analysis resource limits.");
  }
  const manifest = await ProjectWorkspaceFile.find({ projectId: project._id, ownerId: project.ownerId })
    .select("+storageKey")
    .sort({ relativePath: 1 })
    .limit(PROJECT_IMPORT_LIMITS.fileCount + 1);
  if (manifest.length !== project.fileCount || manifest.length > PROJECT_IMPORT_LIMITS.fileCount) {
    throw new ProjectAnalysisError("INVALID_MANIFEST", "The project manifest failed validation.");
  }
  const root = snapshotDirectory(project.ownerId.toString(), project._id.toString(), project.originalSnapshotKey);
  const files: AnalysisInputFile[] = [];
  let measuredBytes = 0;
  let parsedBytes = 0;
  const seen = new Set<string>();
  for (let index = 0; index < manifest.length; index += 1) {
    if (index % 20 === 0) {
      await checkActive();
      await onProgress(index, manifest.length);
    }
    const entry = manifest[index];
    const relativePath = normalizeProjectPath(entry.relativePath);
    if (relativePath !== entry.relativePath || seen.has(relativePath) || isExcludedProjectPath(relativePath) ||
      !/^[a-f0-9]{64}$/i.test(entry.sha256) || !Number.isSafeInteger(entry.size) || entry.size < 0) {
      throw new ProjectAnalysisError("INVALID_MANIFEST", "The project manifest failed validation.");
    }
    seen.add(relativePath);
    const fullPath = safeProjectPath(root, relativePath);
    const textCandidate = needsText(relativePath);
    const tooLarge = textCandidate && entry.size > MAX_FILE_PARSE_BYTES;
    const overTotalParseLimit = textCandidate && !tooLarge && parsedBytes + entry.size > MAX_SOURCE_PARSE_BYTES;
    const readText = textCandidate && !tooLarge && !overTotalParseLimit;
    const verified = await hashAndRead(fullPath, root, readText, checkActive);
    if (verified.size !== entry.size || verified.hash !== entry.sha256) {
      throw new ProjectAnalysisError("SNAPSHOT_INTEGRITY", "A project source file failed integrity checks.");
    }
    measuredBytes += verified.size;
    if (verified.content !== undefined) parsedBytes += verified.size;
    if (measuredBytes > PROJECT_IMPORT_LIMITS.totalBytes) {
      throw new ProjectAnalysisError("ANALYSIS_LIMIT", "The project exceeds the analysis resource limits.");
    }
    files.push({
      path: relativePath,
      size: verified.size,
      sha256: verified.hash,
      content: verified.content,
      contentUnavailableReason: tooLarge ? "size" : overTotalParseLimit ? "limit" : needsText(relativePath) && verified.content === undefined ? "binary" : undefined,
    });
    if (index % 20 === 0 || index + 1 === manifest.length) await onProgress(index + 1, manifest.length);
  }
  if (!manifest.length) await onProgress(0, 0);
  if (measuredBytes !== project.totalSizeBytes) {
    throw new ProjectAnalysisError("INVALID_MANIFEST", "The project manifest failed validation.");
  }
  return { files, projectId: project._id, ownerId: project.ownerId };
}

export async function processAnalysisJob(jobId: string): Promise<void> {
  if (!mongoose.isValidObjectId(jobId)) return;
  const objectId = new mongoose.Types.ObjectId(jobId);
  const startedAt = Date.now();
  const assertActive = async () => {
    if (Date.now() - startedAt > MAX_ANALYSIS_MS) {
      throw new ProjectAnalysisError("ANALYSIS_TIMEOUT", "The project analysis exceeded its time limit.");
    }
    const job = await ProjectAnalysisJob.findById(objectId).select("status cancelRequested");
    if (!job || job.status !== "running" || job.cancelRequested) throwIfCancelled();
  };
  try {
    const job = await ProjectAnalysisJob.findOne({ _id: objectId, status: "running" });
    if (!job) return;
    await ProjectAnalysisJob.updateOne(
      { _id: objectId, status: "running", cancelRequested: false },
      { $set: { currentStage: "validating", progress: 0 } },
    );
    const snapshot = await loadSnapshot(objectId, async (completed, total) => {
      await assertActive();
      const span = PROGRESS_SPANS.validating!;
      const ratio = total > 0 ? Math.min(1, completed / total) : 1;
      const updated = await ProjectAnalysisJob.updateOne(
        { _id: objectId, status: "running", cancelRequested: false },
        { $set: { currentStage: "validating", progress: Math.round(span[0] + span[1] * ratio) } },
      );
      if (updated.modifiedCount !== 1) throwIfCancelled();
    }, assertActive);
    await assertActive();
    const analyzed = await analyzeProject(
      snapshot.projectId.toString(),
      job.analysisVersion,
      snapshot.files,
      async (stage, completed, total) => {
        await assertActive();
        const span = PROGRESS_SPANS[stage];
        const ratio = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 1;
        const progress = span ? Math.min(99, Math.round(span[0] + span[1] * ratio)) : job.progress;
        const updated = await ProjectAnalysisJob.updateOne(
          { _id: objectId, status: "running", cancelRequested: false },
          { $set: { currentStage: stage, progress } },
        );
        if (updated.modifiedCount !== 1) throwIfCancelled();
      },
      assertActive,
    );
    await assertActive();
    if (!validateBlueprintShape(analyzed.blueprint)) {
      throw new ProjectAnalysisError("INVALID_BLUEPRINT", "The generated project report failed schema validation.");
    }
    await ProjectAnalysisFinding.deleteMany({ analysisJobId: objectId, ownerId: snapshot.ownerId });
    await ProjectAnalysisFile.deleteMany({ analysisJobId: objectId, ownerId: snapshot.ownerId });
    if (analyzed.findings.length) {
      await ProjectAnalysisFinding.insertMany(analyzed.findings.map((finding) => ({
        ...finding,
        projectId: snapshot.projectId,
        ownerId: snapshot.ownerId,
        analysisJobId: objectId,
      })));
    }
    if (analyzed.inventoryFiles.length) {
      await ProjectAnalysisFile.insertMany(analyzed.inventoryFiles.map((file) => ({
        ...file,
        projectId: snapshot.projectId,
        ownerId: snapshot.ownerId,
        analysisJobId: objectId,
      })));
    }
    await ProjectBlueprint.findOneAndUpdate(
      { analysisJobId: objectId, ownerId: snapshot.ownerId },
      {
        $set: {
          projectId: snapshot.projectId,
          analysisJobId: objectId,
          ownerId: snapshot.ownerId,
          schemaVersion: 1,
          analysisVersion: job.analysisVersion,
          blueprint: analyzed.blueprint,
          generatedAt: new Date(analyzed.blueprint.metadata.generatedAt),
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    const completed = await ProjectAnalysisJob.updateOne(
      { _id: objectId, status: "running", cancelRequested: false },
      {
        $set: { status: "completed", currentStage: "completed", progress: 100, completedAt: new Date() },
        $unset: { activeKey: 1, errorCode: 1, errorMessage: 1 },
      },
    );
    if (completed.modifiedCount !== 1) throwIfCancelled();
    await ProjectWorkspace.updateOne(
      { _id: snapshot.projectId, ownerId: snapshot.ownerId, activeAnalysisJobId: objectId },
      { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
    );
  } catch (error) {
    const cancelled = error instanceof ProjectAnalysisError && error.code === "ANALYSIS_CANCELLED";
    const code = error instanceof ProjectAnalysisError ? error.code : "ANALYSIS_FAILED";
    await ProjectAnalysisFinding.deleteMany({ analysisJobId: objectId }).catch(() => undefined);
    await ProjectAnalysisFile.deleteMany({ analysisJobId: objectId }).catch(() => undefined);
    await ProjectBlueprint.deleteOne({ analysisJobId: objectId }).catch(() => undefined);
    await ProjectAnalysisJob.updateOne(
      { _id: objectId, status: "running" },
      {
        $set: {
          status: cancelled ? "cancelled" : "failed",
          currentStage: cancelled ? "cancelled" : "failed",
          ...(cancelled ? {} : {
            errorCode: code,
            errorMessage: "Analysis could not complete. Check the project snapshot and retry.",
          }),
          completedAt: new Date(),
        },
        $unset: { activeKey: 1, ...(cancelled ? { errorCode: 1, errorMessage: 1 } : {}) },
      },
    ).catch(() => undefined);
    const job = await ProjectAnalysisJob.findById(objectId).select("projectId ownerId").catch(() => null);
    if (job) {
      await ProjectWorkspace.updateOne(
        { _id: job.projectId, ownerId: job.ownerId, activeAnalysisJobId: objectId },
        { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
      ).catch(() => undefined);
    }
    if (!cancelled) process.stderr.write("Project analysis job " + jobId + " failed (" + code + ").\n");
  }
}
