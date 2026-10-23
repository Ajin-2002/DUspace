import mongoose, { Document, Schema } from "mongoose";

export type WorkspaceSource = "zip" | "folder";
export type WorkspaceStatus =
  | "created"
  | "uploading"
  | "validating"
  | "extracting"
  | "manifest"
  | "saving"
  | "ready"
  | "failed"
  | "deleting";

export interface IProjectWorkspace extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  sourceType: WorkspaceSource;
  status: WorkspaceStatus;
  framework?: string;
  language?: string;
  originalSnapshotKey?: string;
  fileCount: number;
  totalSizeBytes: number;
  lastImportErrorCode?: string;
  latestImportId?: mongoose.Types.ObjectId;
  activeAnalysisJobId?: mongoose.Types.ObjectId;
  analysisLockAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectWorkspaceSchema = new Schema<IProjectWorkspace>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    sourceType: { type: String, enum: ["zip", "folder"], required: true },
    status: {
      type: String,
      enum: [
        "created",
        "uploading",
        "validating",
        "extracting",
        "manifest",
        "saving",
        "ready",
        "failed",
        "deleting",
      ],
      default: "created",
    },
    framework: { type: String, trim: true },
    language: { type: String, trim: true },
    originalSnapshotKey: { type: String, select: false },
    fileCount: { type: Number, default: 0, min: 0 },
    totalSizeBytes: { type: Number, default: 0, min: 0 },
    lastImportErrorCode: { type: String, select: false },
    latestImportId: { type: Schema.Types.ObjectId, ref: "ProjectWorkspaceImport" },
    activeAnalysisJobId: { type: Schema.Types.ObjectId, ref: "ProjectAnalysisJob", select: false },
    analysisLockAt: { type: Date, select: false },
  },
  { timestamps: true },
);

ProjectWorkspaceSchema.index({ ownerId: 1, updatedAt: -1 });
ProjectWorkspaceSchema.index({ ownerId: 1, status: 1, updatedAt: -1 });

export default mongoose.model<IProjectWorkspace>(
  "ProjectWorkspace",
  ProjectWorkspaceSchema,
);
