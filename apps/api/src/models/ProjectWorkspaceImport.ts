import mongoose, { Document, Schema } from "mongoose";
import { WorkspaceSource, WorkspaceStatus } from "./ProjectWorkspace";

export interface IProjectWorkspaceImport extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  sourceType: WorkspaceSource;
  status: WorkspaceStatus;
  progressStage: string;
  finalizationStarted: boolean;
  snapshotKey?: string;
  originalFilename?: string;
  uploadBytes: number;
  extractedBytes: number;
  fileCount: number;
  errorCode?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectWorkspaceImportSchema = new Schema<IProjectWorkspaceImport>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectWorkspace",
      required: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
      required: true,
    },
    progressStage: { type: String, required: true },
    finalizationStarted: { type: Boolean, default: false },
    snapshotKey: { type: String, select: false },
    originalFilename: { type: String, maxlength: 255 },
    uploadBytes: { type: Number, default: 0, min: 0 },
    extractedBytes: { type: Number, default: 0, min: 0 },
    fileCount: { type: Number, default: 0, min: 0 },
    errorCode: { type: String },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

ProjectWorkspaceImportSchema.index({ ownerId: 1, projectId: 1, createdAt: -1 });
ProjectWorkspaceImportSchema.index({ status: 1, updatedAt: 1 });

export default mongoose.model<IProjectWorkspaceImport>(
  "ProjectWorkspaceImport",
  ProjectWorkspaceImportSchema,
);
