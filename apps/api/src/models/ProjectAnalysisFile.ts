import mongoose, { Document, Schema } from "mongoose";

export interface IProjectAnalysisFile extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  analysisJobId: mongoose.Types.ObjectId;
  path: string;
  extension: string;
  category: "source" | "configuration" | "test" | "documentation" | "asset" | "other";
  size: number;
  sha256: string;
  parseStatus: "parsed" | "skipped_binary" | "skipped_size" | "unsupported" | "parse_error";
  createdAt: Date;
}

const ProjectAnalysisFileSchema = new Schema<IProjectAnalysisFile>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectWorkspace", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    analysisJobId: { type: Schema.Types.ObjectId, ref: "ProjectAnalysisJob", required: true },
    path: { type: String, required: true, maxlength: 1024 },
    extension: { type: String, required: true, maxlength: 64 },
    category: { type: String, enum: ["source", "configuration", "test", "documentation", "asset", "other"], required: true },
    size: { type: Number, required: true, min: 0 },
    sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/i },
    parseStatus: { type: String, enum: ["parsed", "skipped_binary", "skipped_size", "unsupported", "parse_error"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ProjectAnalysisFileSchema.index({ ownerId: 1, projectId: 1, analysisJobId: 1, path: 1 }, { unique: true });
ProjectAnalysisFileSchema.index({ analysisJobId: 1, category: 1, path: 1 });

export default mongoose.model<IProjectAnalysisFile>("ProjectAnalysisFile", ProjectAnalysisFileSchema);
