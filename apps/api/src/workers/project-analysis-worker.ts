import "dotenv/config";
import connectDB from "../db";
import ProjectAnalysisJob from "../models/ProjectAnalysisJob";
import ProjectWorkspace from "../models/ProjectWorkspace";
import { processAnalysisJob } from "../utils/project-analysis-runner";

const POLL_DELAY_MS = 1000;
const STALE_JOB_MS = positiveInteger("ANALYSIS_STALE_JOB_SECONDS", 900) * 1000;
const MAX_ATTEMPTS = positiveInteger("ANALYSIS_MAX_ATTEMPTS", 3);
const CONCURRENCY = Math.min(4, positiveInteger("ANALYSIS_WORKER_CONCURRENCY", 1));
let stopping = false;

function positiveInteger(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function recoverStaleJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_JOB_MS);
  const stale = await ProjectAnalysisJob.find({ status: "running", updatedAt: { $lt: cutoff } }).select("_id projectId ownerId attemptCount cancelRequested");
  for (const job of stale) {
    if (job.cancelRequested) {
      await ProjectAnalysisJob.updateOne(
        { _id: job._id, status: "running", updatedAt: { $lt: cutoff } },
        {
          $set: { status: "cancelled", currentStage: "cancelled", completedAt: new Date() },
          $unset: { activeKey: 1 },
        },
      );
      await ProjectWorkspace.updateOne(
        { _id: job.projectId, ownerId: job.ownerId, activeAnalysisJobId: job._id },
        { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
      );
    } else if (job.attemptCount < MAX_ATTEMPTS) {
      await ProjectAnalysisJob.updateOne(
        { _id: job._id, status: "running", updatedAt: { $lt: cutoff } },
        { $set: { status: "queued", currentStage: "queued", progress: 0 }, $unset: { startedAt: 1 } },
      );
    } else {
      await ProjectAnalysisJob.updateOne(
        { _id: job._id, status: "running", updatedAt: { $lt: cutoff } },
        {
          $set: {
            status: "failed",
            currentStage: "failed",
            errorCode: "WORKER_INTERRUPTED",
            errorMessage: "Analysis stopped before it completed. Retry to start a new analysis.",
            completedAt: new Date(),
          },
          $unset: { activeKey: 1 },
        },
      );
      await ProjectWorkspace.updateOne(
        { _id: job.projectId, ownerId: job.ownerId, activeAnalysisJobId: job._id },
        { $unset: { activeAnalysisJobId: 1, analysisLockAt: 1 } },
      );
    }
  }
}

async function claimNextJob() {
  return ProjectAnalysisJob.findOneAndUpdate(
    { status: "queued", cancelRequested: false },
    {
      $set: { status: "running", currentStage: "validating", startedAt: new Date(), progress: 0 },
      $inc: { attemptCount: 1 },
      $unset: { errorCode: 1, errorMessage: 1 },
    },
    { returnDocument: "after", sort: { createdAt: 1 } },
  );
}

async function workerLoop(workerNumber: number): Promise<void> {
  let lastRecovery = Date.now();
  while (!stopping) {
    try {
      if (Date.now() - lastRecovery >= 60_000) {
        await recoverStaleJobs();
        lastRecovery = Date.now();
      }
      const job = await claimNextJob();
      if (job) {
        await processAnalysisJob(job._id.toString());
        continue;
      }
      await wait(POLL_DELAY_MS);
    } catch {
      process.stderr.write("Project analysis worker " + workerNumber + " encountered a queue error.\n");
      await wait(POLL_DELAY_MS * 2);
    }
  }
}

export async function runProjectAnalysisWorkers(): Promise<void> {
  stopping = false;
  await recoverStaleJobs();
  process.stdout.write("Project analysis worker started with concurrency " + CONCURRENCY + ".\n");
  const workers = Array.from({ length: CONCURRENCY }, (_value, index) => workerLoop(index + 1));
  await Promise.all(workers);
}

async function startStandaloneWorker(): Promise<void> {
  await connectDB();
  await runProjectAnalysisWorkers();
}

process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });

if (require.main === module) void startStandaloneWorker().catch(() => {
  process.stderr.write("Project analysis worker could not start. Verify database configuration and retry.\n");
  process.exitCode = 1;
});
