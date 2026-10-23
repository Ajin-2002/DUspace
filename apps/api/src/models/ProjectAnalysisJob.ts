import mongoose, { Document, Schema } from "mongoose";

export const ANALYSIS_STAGES = [
  "queued",
  "validating",
  "inventory",
  "framework_detection",
  "dependency_analysis",
  "source_analysis",
  "architecture_analysis",
  "ui_analysis",
  "quality_checks",
  "blueprint_generation",
  "completed",
  "failed",
  "cancelled",
] as const;

export type AnalysisStage = (typeof ANALYSIS_STAGES)[number];
export type AnalysisJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface IProjectAnalysisJob extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  status: AnalysisJobStatus;
  currentStage: AnalysisStage;
  progress: number;
  attemptCount: number;
  analysisVersion: number;
  activeKey?: string | null;
  cancelRequested: boolean;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const ProjectAnalysisJobSchema = new Schema<IProjectAnalysisJob>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectWorkspace", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      required: true,
      default: "queued",
    },
    currentStage: { type: String, enum: ANALYSIS_STAGES, required: true, default: "queued" },
    progress: { type: Number, min: 0, max: 100, required: true, default: 0 },
    attemptCount: { type: Number, min: 0, required: true, default: 0 },
    analysisVersion: { type: Number, min: 1, required: true },
    activeKey: { type: String, default: null, select: false },
    cancelRequested: { type: Boolean, default: false },
    errorCode: { type: String, maxlength: 80 },
    errorMessage: { type: String, maxlength: 300 },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

ProjectAnalysisJobSchema.index({ ownerId: 1, projectId: 1, createdAt: -1 });
ProjectAnalysisJobSchema.index({ status: 1, createdAt: 1 });
ProjectAnalysisJobSchema.index({ projectId: 1, analysisVersion: 1 }, { unique: true });
ProjectAnalysisJobSchema.index(
  { ownerId: 1, projectId: 1, activeKey: 1 },
  { unique: true, partialFilterExpression: { activeKey: { $type: "string" } } },
);

export default mongoose.model<IProjectAnalysisJob>("ProjectAnalysisJob", ProjectAnalysisJobSchema);
