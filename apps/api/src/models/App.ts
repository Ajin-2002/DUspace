import mongoose, { Document, Schema } from "mongoose";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IFileEntry {
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  fileType: "executable" | "installer" | "source" | "document" | "media" | "archive" | "other";
}

export interface IBuildConfig {
  runtimeVersion?: string;
  packageManager?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
  port?: number;
}

export interface IEnvVar {
  key: string;
  encryptedValue: string;
  isSecret: boolean;
}

export interface IImportSource {
  type: "zip" | "github" | "git";
  githubRepoUrl?: string;
  githubBranch?: string;
  githubRepoName?: string;
  gitUrl?: string;
  gitBranch?: string;
  importedAt?: Date;
}

export interface IDetectedTech {
  language?: string;
  framework?: string;
  packageManager?: string;
  runtime?: string;
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
  detectedAt?: Date;
  isEdited: boolean;
}

export type ProjectType =
  | "web-app"
  | "mobile-app"
  | "desktop-app"
  | "api-backend"
  | "library-package"
  | "cli-tool"
  | "ui-component"
  | "developer-tool";

export interface IApp extends Document {
  developerId: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description: string;
  projectType: ProjectType;
  category: string;
  tags: string[];
  languages: string[];
  frameworks: string[];
  license?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  websiteUrl?: string;
  files: IFileEntry[];
  icon?: string;
  coverImage?: string;
  banner?: string;
  screenshots: string[];
  rating?: number;
  downloads?: number;
  views?: number;
  status: "draft" | "pending" | "published" | "rejected" | "archived";
  visibility: "private" | "public";
  releaseNotes?: string;
  requirements?: string[];
  currentVersion?: string;
  buildConfig: IBuildConfig;
  envVars: IEnvVar[];
  importSource?: IImportSource;
  detectedTech?: IDetectedTech;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const FileEntrySchema = new Schema<IFileEntry>(
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

const BuildConfigSchema = new Schema<IBuildConfig>(
  {
    runtimeVersion: String,
    packageManager: String,
    installCommand: String,
    buildCommand: String,
    startCommand: String,
    outputDirectory: String,
    port: Number,
  },
  { _id: false }
);

const EnvVarSchema = new Schema<IEnvVar>(
  {
    key: { type: String, required: true },
    encryptedValue: { type: String, required: true },
    isSecret: { type: Boolean, default: true },
  },
  { _id: false }
);

const ImportSourceSchema = new Schema<IImportSource>(
  {
    type: { type: String, enum: ["zip", "github", "git"], required: true },
    githubRepoUrl: String,
    githubBranch: String,
    githubRepoName: String,
    gitUrl: String,
    gitBranch: String,
    importedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DetectedTechSchema = new Schema<IDetectedTech>(
  {
    language: String,
    framework: String,
    packageManager: String,
    runtime: String,
    buildCommand: String,
    startCommand: String,
    outputDirectory: String,
    detectedAt: { type: Date, default: Date.now },
    isEdited: { type: Boolean, default: false },
  },
  { _id: false }
);

const AppSchema = new Schema<IApp>(
  {
    developerId: { type: String, required: true, index: true },
    slug: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    description: { type: String, trim: true, default: "" },
    projectType: {
      type: String,
      enum: [
        "web-app",
        "mobile-app",
        "desktop-app",
        "api-backend",
        "library-package",
        "cli-tool",
        "ui-component",
        "developer-tool",
      ],
      default: "web-app",
    },
    category: { type: String, default: "Utilities" },
    tags: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    frameworks: [{ type: String, trim: true }],
    license: { type: String, trim: true },
    repositoryUrl: { type: String, trim: true },
    documentationUrl: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    files: [FileEntrySchema],
    icon: String,
    coverImage: String,
    banner: String,
    screenshots: [String],
    rating: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected", "archived"],
      default: "draft",
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    releaseNotes: String,
    requirements: [String],
    currentVersion: { type: String, default: "—" },
    buildConfig: { type: BuildConfigSchema, default: () => ({}) },
    envVars: [EnvVarSchema],
    importSource: ImportSourceSchema,
    detectedTech: DetectedTechSchema,
    publishedAt: Date,
  },
  { timestamps: true }
);

// Auto-generate slug before save if not set
AppSchema.pre<IApp>("save", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

export default mongoose.model<IApp>("App", AppSchema);
