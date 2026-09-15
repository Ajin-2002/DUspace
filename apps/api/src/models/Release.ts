import mongoose, { Document, Schema } from "mongoose";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IReleaseFile {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  fileType: "executable" | "installer" | "source" | "document" | "media" | "archive" | "other";
}

export type ReleaseChannel = "alpha" | "beta" | "stable";

export interface IRelease extends Document {
  projectId: string;
  version: string;
  title?: string;
  releaseNotes?: string;
  changelog?: string;
  screenshots: string[];
  icon?: string;
  channel: ReleaseChannel;
  status: "draft" | "published";
  files: IReleaseFile[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ReleaseFileSchema = new Schema<IReleaseFile>(
  {
    originalName: String,
    filename: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    fileType: {
      type: String,
      enum: ["executable", "installer", "source", "document", "media", "archive", "other"],
      default: "other",
    },
  },
  { _id: false }
);

const ReleaseSchema = new Schema<IRelease>(
  {
    projectId: { type: String, required: true, index: true },
    version: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    releaseNotes: { type: String, trim: true },
    changelog: { type: String, trim: true },
    screenshots: [String],
    icon: String,
    channel: {
      type: String,
      enum: ["alpha", "beta", "stable"],
      default: "stable",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    files: [ReleaseFileSchema],
    publishedAt: Date,
  },
  { timestamps: true }
);

// Compound unique index: one version per project
ReleaseSchema.index({ projectId: 1, version: 1 }, { unique: true });

export default mongoose.model<IRelease>("Release", ReleaseSchema);
