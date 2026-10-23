import mongoose, { Document, Schema } from "mongoose";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";
export type FindingCategory = "security" | "quality" | "configuration" | "dependency";

export interface IProjectAnalysisFinding extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  analysisJobId: mongoose.Types.ObjectId;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  fileReference?: string;
  lineStart?: number;
  lineEnd?: number;
  evidenceType: "confirmed" | "inferred";
  confidence: number;
  remediation?: string;
  status: "open" | "resolved" | "ignored";
  createdAt: Date;
}

const ProjectAnalysisFindingSchema = new Schema<IProjectAnalysisFinding>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectWorkspace", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    analysisJobId: { type: Schema.Types.ObjectId, ref: "ProjectAnalysisJob", required: true },
    category: { type: String, enum: ["security", "quality", "configuration", "dependency"], required: true },
    severity: { type: String, enum: ["critical", "high", "medium", "low", "info"], required: true },
    title: { type: String, required: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 1000 },
    fileReference: { type: String, maxlength: 1024 },
    lineStart: { type: Number, min: 1 },
    lineEnd: { type: Number, min: 1 },
    evidenceType: { type: String, enum: ["confirmed", "inferred"], required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    remediation: { type: String, maxlength: 1000 },
    status: { type: String, enum: ["open", "resolved", "ignored"], default: "open" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ProjectAnalysisFindingSchema.index({ ownerId: 1, projectId: 1, analysisJobId: 1, createdAt: -1 });
ProjectAnalysisFindingSchema.index({ analysisJobId: 1, severity: 1, category: 1 });

export default mongoose.model<IProjectAnalysisFinding>("ProjectAnalysisFinding", ProjectAnalysisFindingSchema);
