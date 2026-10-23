import mongoose, { Document, Schema } from "mongoose";

export interface IProjectWorkspaceFile extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  relativePath: string;
  storageKey: string;
  size: number;
  mimeType: string;
  sha256: string;
  createdAt: Date;
}

const ProjectWorkspaceFileSchema = new Schema<IProjectWorkspaceFile>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectWorkspace",
      required: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    relativePath: { type: String, required: true, maxlength: 1024 },
    storageKey: { type: String, required: true, select: false },
    size: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true, maxlength: 120 },
    sha256: { type: String, required: true, minlength: 64, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ProjectWorkspaceFileSchema.index(
  { projectId: 1, relativePath: 1 },
  { unique: true },
);
ProjectWorkspaceFileSchema.index({ ownerId: 1, projectId: 1 });

export default mongoose.model<IProjectWorkspaceFile>(
  "ProjectWorkspaceFile",
  ProjectWorkspaceFileSchema,
);
