# 📡 DUspace REST API Reference

Base URL: `http://localhost:5001` (development) | Production URL from `render.yaml`

All authenticated endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔑 Authentication

### `POST /api/auth/register`
Create a new user account.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response `201`:**
```json
{
  "message": "Account created",
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "isDeveloper": false,
    "developerStatus": "none"
  }
}
```

**Errors:**
- `400` — Missing required fields
- `409` — Email already registered

---

### `POST /api/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { ... }
}
```

**Errors:**
- `400` — Missing fields
- `401` — Invalid credentials

---

### `POST /api/auth/oauth`
Create or retrieve a user via OAuth (called by NextAuth after Google sign-in).

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@gmail.com",
  "image": "https://..."
}
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { ... }
}
```

---

### `GET /api/auth/me` 🔒
Get the currently authenticated user.

**Response `200`:**
```json
{
  "id": "...",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "developer",
  "avatar": "https://...",
  "isDeveloper": true,
  "developerStatus": "approved",
  "developerProfile": {
    "displayName": "Jane Dev",
    "bio": "Full-stack developer",
    "skills": ["React", "Node.js"],
    "githubUrl": "https://github.com/jane",
    "registeredAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 👨‍💻 Developer

### `POST /api/developer/register` 🔒
Upgrade a user account to a developer account.

**Body:**
```json
{
  "displayName": "Jane Dev",
  "bio": "I build cool things",
  "website": "https://janedev.com"
}
```

**Response `200`:**
```json
{
  "message": "Developer registration successful",
  "token": "<new_jwt_with_developer_role>",
  "user": { ... }
}
```

**Errors:**
- `400` — displayName required
- `409` — Already a developer

---

### `GET /api/developer/profile` 🔒🛡️
Get the current developer's profile.

**Response `200`:**
```json
{
  "id": "...",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "isDeveloper": true,
  "developerProfile": { ... }
}
```

---

### `PUT /api/developer/profile` 🔒🛡️
Update developer profile fields.

**Body (all fields optional):**
```json
{
  "displayName": "Jane Dev",
  "bio": "Updated bio",
  "website": "https://janedev.com",
  "avatar": "https://...",
  "skills": ["React", "Go"],
  "githubUrl": "https://github.com/jane",
  "twitterUrl": "https://twitter.com/jane",
  "linkedinUrl": "https://linkedin.com/in/jane"
}
```

**Response `200`:**
```json
{
  "message": "Developer profile updated",
  "developerProfile": { ... }
}
```

---

### `GET /api/developer/stats` 🔒🛡️
Get aggregate statistics for the developer.

**Response `200`:**
```json
{
  "totalProjects": 12,
  "publishedProjects": 8,
  "draftProjects": 3,
  "archivedProjects": 1,
  "totalViews": 42500,
  "totalDownloads": 8200,
  "avgRating": 4.3
}
```

---

## 📦 Projects (Apps)

### `POST /api/developer/apps` 🔒🛡️
Create a new project.

**Body:**
```json
{
  "name": "My Awesome App",
  "shortDescription": "A brief summary",
  "description": "Full description of the app",
  "projectType": "web-app",
  "category": "Utilities",
  "tags": ["productivity", "tool"],
  "languages": ["TypeScript"],
  "frameworks": ["React"],
  "license": "MIT",
  "repositoryUrl": "https://github.com/...",
  "websiteUrl": "https://myapp.com"
}
```

**`projectType` values:** `web-app`, `mobile-app`, `desktop-app`, `api-backend`, `library-package`, `cli-tool`, `ui-component`, `developer-tool`

**Response `201`:**
```json
{
  "app": {
    "_id": "...",
    "slug": "my-awesome-app",
    "status": "draft",
    "visibility": "private",
    ...
  }
}
```

---

### `GET /api/developer/apps` 🔒🛡️
List all projects for the authenticated developer.

**Query Params:**
| Param    | Description                                      |
|----------|--------------------------------------------------|
| `status` | Filter by status: `draft`, `published`, `archived`, `all` |
| `q`      | Search by name (case-insensitive)                |

**Response `200`:**
```json
{
  "apps": [ { ... }, { ... } ]
}
```

---

### `GET /api/developer/apps/:appId` 🔒🛡️
Get a single project by ID.

**Response `200`:**
```json
{
  "app": { ... }
}
```

---

### `PUT /api/developer/apps/:appId` 🔒🛡️
Update project metadata.

**Body (any subset of fields):**
```json
{
  "name": "New Name",
  "description": "Updated description",
  "tags": ["new-tag"],
  "visibility": "public",
  "buildConfig": {
    "runtimeVersion": "18",
    "buildCommand": "npm run build",
    "startCommand": "npm start"
  }
}
```

---

### `DELETE /api/developer/apps/:appId` 🔒🛡️
Delete a project permanently.

**Response `200`:**
```json
{ "message": "Project deleted" }
```

---

### `POST /api/developer/apps/:appId/detect` 🔒🛡️
Auto-detect the tech stack from uploaded files.

Detects: Node.js, Next.js, Vite, Angular, Nuxt.js, Python, Go, Rust, Java (Maven/Gradle)

**Response `200`:**
```json
{
  "detected": {
    "language": "JavaScript / TypeScript",
    "framework": "Next.js",
    "packageManager": "pnpm",
    "runtime": "Node.js",
    "buildCommand": "pnpm run build",
    "startCommand": "pnpm start",
    "outputDirectory": ".next"
  },
  "app": { ... }
}
```

---

### `POST /api/developer/apps/:appId/import` 🔒🛡️
Import project source from ZIP, GitHub, or Git.

**Body (ZIP):**
```json
{ "type": "zip" }
```

**Body (GitHub):**
```json
{
  "type": "github",
  "githubRepoUrl": "https://github.com/user/repo",
  "githubBranch": "main"
}
```

---

### `POST /api/developer/apps/:appId/upload` 🔒🛡️
Upload project files. Uses `multipart/form-data`.

**Form field:** `files` (multiple allowed, 500 MB per file limit)

**Response `200`:**
```json
{
  "message": "Files uploaded",
  "files": [ { "originalName": "...", "filename": "...", "fileType": "source" } ]
}
```

---

### `POST /api/developer/apps/:appId/cover` 🔒🛡️
Upload a cover image (JPEG/PNG/GIF/WebP, max 10 MB).

**Form field:** `cover`

---

### `GET /api/developer/apps/:appId/env` 🔒🛡️
List environment variables (values are masked).

**Response `200`:**
```json
{
  "envVars": [
    { "key": "DATABASE_URL", "maskedValue": "po••••••••••••••rd" }
  ]
}
```

---

### `POST /api/developer/apps/:appId/env` 🔒🛡️
Add or update an environment variable (value is AES-256 encrypted at rest).

**Body:**
```json
{
  "key": "API_KEY",
  "value": "my-secret-key",
  "isSecret": true
}
```

---

### `DELETE /api/developer/apps/:appId/env/:key` 🔒🛡️
Remove an environment variable by key.

---

### `POST /api/developer/apps/:appId/submit` 🔒🛡️
Submit the project for admin review. Changes `status` from `draft` → `pending`.

---

### `POST /api/developer/apps/:appId/archive` 🔒🛡️
Archive a project. Changes `status` to `archived`.

---

## 🏷️ Releases

### `POST /api/developer/apps/:appId/releases` 🔒🛡️
Create a new draft release.

**Body:**
```json
{
  "version": "1.2.0",
  "title": "Performance Update",
  "releaseNotes": "Improved loading speed by 40%",
  "changelog": "- Fixed memory leak\n- Added dark mode",
  "channel": "stable"
}
```

**`channel` values:** `alpha`, `beta`, `stable`

**Response `201`:**
```json
{
  "release": {
    "_id": "...",
    "version": "1.2.0",
    "status": "draft",
    "channel": "stable",
    ...
  }
}
```

**Errors:**
- `409` — Version already exists for this project

---

### `GET /api/developer/apps/:appId/releases` 🔒🛡️
List all releases for a project (newest first).

**Response `200`:**
```json
{
  "releases": [ { ... }, { ... } ]
}
```

---

### `GET /api/developer/apps/:appId/releases/:releaseId` 🔒🛡️
Get a single release.

---

### `PUT /api/developer/apps/:appId/releases/:releaseId` 🔒🛡️
Update a draft release. Cannot edit published releases.

**Body (any subset):**
```json
{
  "title": "Updated Title",
  "releaseNotes": "...",
  "changelog": "...",
  "channel": "beta"
}
```

---

### `POST /api/developer/apps/:appId/releases/:releaseId/upload` 🔒🛡️
Upload files to a release. Up to 10 files, 500 MB each.

**Form field:** `files`

---

### `PUT /api/developer/apps/:appId/releases/:releaseId/publish` 🔒🛡️
Publish a release. This:
1. Sets `release.status = "published"` and `publishedAt`
2. Updates `app.currentVersion` to this release's version
3. Sets `app.status = "published"` and `app.visibility = "public"` if not already
4. Copies release icon/screenshots to the app

**Response `200`:**
```json
{
  "release": { ... },
  "app": { ... },
  "publicUrl": "/apps/my-awesome-app"
}
```

---

### `DELETE /api/developer/apps/:appId/releases/:releaseId` 🔒🛡️
Delete a draft release. Cannot delete published releases.

---

## 🌍 Public App Store

### `GET /api/apps`
Browse all published apps.

**Query Params:**
| Param      | Description                        |
|------------|------------------------------------|
| `q`        | Search by name or description      |
| `category` | Filter by category                 |
| `type`     | Filter by `projectType`            |
| `sort`     | `newest`, `popular`, `top-rated`   |
| `page`     | Page number (default: 1)           |
| `limit`    | Results per page (default: 20)     |

**Response `200`:**
```json
{
  "apps": [ { ... } ],
  "total": 150,
  "page": 1
}
```

---

### `GET /api/apps/:slug`
Get a published app's full details by slug. Increments view count.

**Response `200`:**
```json
{
  "app": {
    "slug": "my-awesome-app",
    "name": "My Awesome App",
    "status": "published",
    "currentVersion": "1.2.0",
    "downloads": 420,
    "views": 8500,
    "rating": 4.7,
    ...
  }
}
```

---

### `POST /api/apps/:slug/download`
Increment download count for an app.

---

## ❌ Error Responses

All error responses follow the format:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning                             |
|--------|-------------------------------------|
| `400`  | Bad request / validation error      |
| `401`  | Not authenticated                   |
| `403`  | Forbidden (wrong role)              |
| `404`  | Resource not found                  |
| `409`  | Conflict (duplicate)                |
| `500`  | Internal server error               |

---

## 🏥 Health Check

### `GET /health`
Check if the API is running.

**Response `200`:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

---

## 🔐 Auth Legend

| Symbol | Meaning                                 |
|--------|-----------------------------------------|
| 🔒     | Requires `Authorization: Bearer <token>` |
| 🛡️     | Requires developer account (`isDeveloper: true`) |
