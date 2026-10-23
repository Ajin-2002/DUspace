import mongoose, { Document, Schema } from "mongoose";

export interface ProjectBlueprintData {
  schemaVersion: 1;
  projectId: string;
  analysisVersion: number;
  summary: { description: string; primaryFramework: string | null; languages: string[] };
  inventory: {
    fileCount: number;
    sourceFileCount: number;
    assetCount: number;
    configurationFileCount: number;
    documentationFileCount: number;
    testFileCount: number;
    skippedFileCount: number;
    totalSizeBytes: number;
  };
  technologies: Array<{ name: string; kind: string; confidence: number; evidence: string[] }>;
  architecture: {
    entryPoints: string[];
    routes: Array<{ path: string; framework: string; file: string; type: string; confidence: number; dynamic: boolean }>;
    layouts: string[];
    apiEndpoints: Array<{ path: string; framework: string; file: string; type: string; confidence: number; dynamic: boolean }>;
    dataModels: string[];
    authenticationPatterns: Array<{ name: string; evidence: string[]; confidence: number }>;
    environmentVariables: string[];
    externalIntegrations: string[];
  };
  uiInventory: {
    pages: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    components: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    navigation: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    forms: Array<{ name: string; file: string; role: string; confidence: number; shared: boolean; relatedRoutes: string[]; hasHandlers: boolean; evidence: string[] }>;
    designTokens: string[];
    stylingSystems: string[];
    responsiveIndicators: string[];
  };
  dependencies: {
    packageManager: string | null;
    direct: Array<{ name: string; version: string; source: string; confidence: number }>;
    development: Array<{ name: string; version: string; source: string; confidence: number }>;
    observedImports: string[];
    lockfile: string | null;
    scripts: Record<string, string>;
    declaredRuntime: Record<string, string>;
    advisoryCoverage: "not_configured" | "partial";
  };
  quality: {
    findingsCount: number;
    checksCompleted: string[];
    checksSkipped: string[];
    limitations: string[];
  };
  metadata: {
    generatedAt: string;
    status: "completed" | "incomplete";
    aiStatus: "unavailable";
  };
}

export interface IProjectBlueprint extends Document {
  projectId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  analysisJobId: mongoose.Types.ObjectId;
  schemaVersion: number;
  analysisVersion: number;
  blueprint: ProjectBlueprintData;
  generatedAt: Date;
  createdAt: Date;
}

const ProjectBlueprintSchema = new Schema<IProjectBlueprint>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "ProjectWorkspace", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    analysisJobId: { type: Schema.Types.ObjectId, ref: "ProjectAnalysisJob", required: true },
    schemaVersion: { type: Number, required: true, enum: [1] },
    analysisVersion: { type: Number, required: true, min: 1 },
    blueprint: { type: Schema.Types.Mixed, required: true },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ProjectBlueprintSchema.index({ ownerId: 1, projectId: 1, analysisVersion: -1 });
ProjectBlueprintSchema.index({ analysisJobId: 1 }, { unique: true });
ProjectBlueprintSchema.index({ projectId: 1, analysisVersion: 1 }, { unique: true });

export default mongoose.model<IProjectBlueprint>("ProjectBlueprint", ProjectBlueprintSchema);
