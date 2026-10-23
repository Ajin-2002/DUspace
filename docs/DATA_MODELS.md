# 🗺️ DUspace Data Models Reference

Complete reference for all MongoDB data models used in DUspace.

---

## 👤 User Model

**Collection:** `users`  
**File:** [`apps/api/src/models/User.ts`](../apps/api/src/models/User.ts)

### Schema

```ts
{
  name: string;                // required, trimmed
  email: string;               // required, unique, lowercase
  password?: string;           // bcrypt-hashed; excluded from queries by default (select: false)
  role: "user" | "developer";  // default: "user"
  isDeveloper: boolean;        // default: false
  developerStatus: "none" | "pending" | "approved" | "rejected"; // default: "none"
  developerProfile?: DeveloperProfile; // only set after developer registration
  googleId?: string;           // sparse index — set for OAuth users
  avatar?: string;             // profile image URL
  createdAt: Date;             // auto (timestamps)
  updatedAt: Date;             // auto (timestamps)
}
```

### DeveloperProfile (embedded)

```ts
{
  displayName: string;   // required
  bio?: string;
  website?: string;
  avatar?: string;
  skills: string[];
  githubUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  registeredAt: Date;    // default: Date.now
}
```

### Indexes

| Field     | Type   | Notes               |
|-----------|--------|---------------------|
| `email`   | unique | auto-created        |
| `googleId`| sparse | only for OAuth users|

### Hooks

- **Pre-save**: hashes `password` with bcrypt (12 rounds) if modified
- **Method `comparePassword(candidate)`**: compares plain text to stored hash

---

## 📦 App Model

**Collection:** `apps`  
**File:** [`apps/api/src/models/App.ts`](../apps/api/src/models/App.ts)

### Schema

```ts
{
  developerId: string;          // required, indexed — User._id
  slug: string;                 // auto-generated from name, indexed
  name: string;                 // required
  shortDescription?: string;
  description: string;          // default: ""
  projectType: ProjectType;     // default: "web-app"
  category: string;             // default: "Utilities"
  tags: string[];
  languages: string[];
  frameworks: string[];
  license?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  websiteUrl?: string;
  files: FileEntry[];           // uploaded file metadata
  icon?: string;                // URL to icon image
  coverImage?: string;          // URL to cover image
  banner?: string;              // URL to banner image
  screenshots: string[];        // array of screenshot URLs
  rating: number;               // default: 0
  downloads: number;            // default: 0
  views: number;                // default: 0
  status: AppStatus;            // default: "draft"
  visibility: "private" | "public"; // default: "private"
  releaseNotes?: string;
  requirements?: string[];
  currentVersion: string;       // default: "—"
  buildConfig: BuildConfig;
  envVars: EnvVar[];            // values are AES-256 encrypted
  importSource?: ImportSource;
  detectedTech?: DetectedTech;
  publishedAt?: Date;
  createdAt: Date;              // auto (timestamps)
  updatedAt: Date;              // auto (timestamps)
}
```

### ProjectType Enum

```ts
type ProjectType =
  | "web-app"
  | "mobile-app"
  | "desktop-app"
  | "api-backend"
  | "library-package"
  | "cli-tool"
  | "ui-component"
  | "developer-tool";
```

### AppStatus Lifecycle

```
draft ──▶ pending ──▶ published
                 └──▶ rejected ──▶ (re-submit as draft)
published ──▶ archived
```

### Embedded Types

#### FileEntry
```ts
{
  originalName: string;
  filename: string;            // server-generated unique filename
  mimeType: string;
  size: number;                // bytes
  uploadedAt: Date;
  fileType: "executable" | "installer" | "source" | "document" | "media" | "archive" | "other";
}
```

#### BuildConfig
```ts
{
  runtimeVersion?: string;     // e.g. "18", "3.11"
  packageManager?: string;     // e.g. "pnpm", "pip"
  installCommand?: string;     // e.g. "pnpm install"
  buildCommand?: string;       // e.g. "pnpm run build"
  startCommand?: string;       // e.g. "node dist/index.js"
  outputDirectory?: string;    // e.g. ".next", "dist"
  port?: number;
}
```

#### EnvVar
```ts
{
  key: string;              // e.g. "DATABASE_URL"
  encryptedValue: string;   // AES-256-CBC encrypted
  isSecret: boolean;        // default: true
}
```

#### ImportSource
```ts
{
  type: "zip" | "github" | "git";
  githubRepoUrl?: string;
  githubBranch?: string;
  githubRepoName?: string;
  gitUrl?: string;
  gitBranch?: string;
  importedAt: Date;
}
```

#### DetectedTech
```ts
{
  language?: string;       // e.g. "JavaScript / TypeScript"
  framework?: string;      // e.g. "Next.js"
  packageManager?: string; // e.g. "pnpm"
  runtime?: string;        // e.g. "Node.js"
  buildCommand?: string;
  startCommand?: string;
  outputDirectory?: string;
  detectedAt: Date;
  isEdited: boolean;       // true if developer manually overrode
}
```

### Indexes

| Field        | Type   | Notes              |
|--------------|--------|--------------------|
| `developerId`| index  | fast dev app lookup|
| `slug`       | index  | fast public URL lookup|

### Hooks

- **Pre-save**: auto-generates `slug` from `name` if not set (lowercased, hyphenated)

---

## 🏷️ Release Model

**Collection:** `releases`  
**File:** [`apps/api/src/models/Release.ts`](../apps/api/src/models/Release.ts)

### Schema

```ts
{
  projectId: string;           // required, indexed — App._id
  version: string;             // required, e.g. "1.2.0"
  title?: string;
  releaseNotes?: string;
  changelog?: string;
  screenshots: string[];       // screenshot URLs for this release
  icon?: string;               // icon URL for this release
  channel: ReleaseChannel;     // default: "stable"
  status: "draft" | "published"; // default: "draft"
  files: ReleaseFile[];
  publishedAt?: Date;
  createdAt: Date;             // auto (timestamps)
  updatedAt: Date;             // auto (timestamps)
}
```

### ReleaseChannel Enum

```ts
type ReleaseChannel = "alpha" | "beta" | "stable";
```

### ReleaseFile (embedded)

```ts
{
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;                // bytes
  uploadedAt: Date;
  fileType: "executable" | "installer" | "source" | "document" | "media" | "archive" | "other";
}
```

### Indexes

| Fields                  | Type            | Notes                              |
|-------------------------|-----------------|------------------------------------|
| `projectId`             | index           | fast lookup of an app's releases   |
| `projectId` + `version` | unique compound | prevents duplicate versions per app|

---

## 🔗 Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────────┐
│      User        │         │         App          │
│──────────────────│         │──────────────────────│
│ _id (ObjectId)   │◀──┐     │ _id (ObjectId)       │
│ name             │   │     │ developerId (String) ─┘
│ email (unique)   │   └─────│ slug (String, indexed)│
│ password (hidden)│         │ name                 │
│ role             │         │ status               │
│ isDeveloper      │         │ files: FileEntry[]   │
│ developerStatus  │         │ buildConfig          │
│ developerProfile │         │ envVars: EnvVar[]    │
│   ├ displayName  │         │ detectedTech         │
│   ├ bio          │         │ importSource         │
│   ├ skills[]     │         │ downloads            │
│   └ socialUrls   │         │ views                │
│ googleId (sparse)│         │ rating               │
└──────────────────┘         └──────────┬───────────┘
                                        │ 1
                                        │ M
                             ┌──────────▼───────────┐
                             │       Release        │
                             │──────────────────────│
                             │ _id (ObjectId)       │
                             │ projectId (String) ──┘
                             │ version              │
                             │ channel              │
                             │ status               │
                             │ files: ReleaseFile[] │
                             │ publishedAt          │
                             └──────────────────────┘
```

---

## 📝 Notes on Design Decisions

### Why `developerId` is String, not ObjectId?

The `developerId` field on `App` is stored as `String` rather than `ObjectId`. This simplifies comparison (`===`) with `req.userId` (which comes from the JWT payload as a string). If you're adding queries that join across collections, you may want to convert to ObjectId first.

### Why `envVars` are embedded in App?

Environment variables are tightly scoped to a single project. Embedding them avoids an extra collection and makes it trivial to delete all env vars when a project is deleted. Values are encrypted with AES-256-CBC so they're safe at rest.

### Why `password` uses `select: false`?

To prevent accidental password leakage in API responses. Every query that **needs** the password (login) must explicitly opt in with `.select("+password")`.
