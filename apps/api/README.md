# 🔌 DUspace API — Express Backend

The API is a **REST backend** built with **Express 5** and **TypeScript**, backed by **MongoDB Atlas** via Mongoose. It handles authentication, developer management, project/app CRUD, release management, and file uploads.

---

## 📁 Project Structure

```
apps/api/
├── src/
│   ├── index.ts          # Entry point — app setup, middleware, route mounting
│   ├── db.ts             # MongoDB connection logic
│   ├── middleware/
│   │   ├── auth.ts       # JWT auth middleware (requireAuth, requireDeveloper)
│   │   └── virus-scan.ts # File upload virus scanning middleware
│   ├── models/
│   │   ├── User.ts       # User + DeveloperProfile Mongoose model
│   │   ├── App.ts        # App/Project Mongoose model
│   │   └── Release.ts    # Release Mongoose model
│   ├── routes/
│   │   ├── auth.ts       # /api/auth/* — register, login, oauth, /me
│   │   ├── developer.ts  # /api/developer/* — profile, stats
│   │   ├── apps.ts       # /api/developer/apps/* — project CRUD, uploads
│   │   └── releases.ts   # /api/developer/apps/:id/releases/* — release management
│   └── utils/
├── .env                  # Local environment variables (not committed)
├── .env.example          # Template for environment variables
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable         | Required | Description                                              |
|------------------|----------|----------------------------------------------------------|
| `MONGODB_URI`    | ✅       | MongoDB Atlas connection string                          |
| `JWT_SECRET`     | ✅       | Secret for signing JWTs (min 32 chars). Use `openssl rand -base64 32` |
| `PORT`           | ❌       | Port to listen on (default: `5000`)                      |
| `CLIENT_URL`     | ✅       | Frontend URL for CORS (e.g. `http://localhost:3000`)     |
| `UPLOAD_DIR`     | ❌       | Directory for uploaded files (default: `./uploads`)      |
| `ENV_ENCRYPTION_KEY` | ❌   | AES-256 key for encrypting env var values (32 chars)     |

---

## 🚀 Running the API

### Development (hot reload)
```bash
pnpm dev
# uses nodemon + tsx for TypeScript hot-reload
```

### Production
```bash
pnpm build   # compiles TypeScript → dist/
pnpm start   # runs dist/index.js
```

The API will be available at **http://localhost:5001** (or `PORT` from env).

---

## 🔐 Authentication

### How it works

1. **Register/Login** → server returns a signed **JWT** (7-day expiry)
2. **Client stores the JWT** and sends it as `Authorization: Bearer <token>`
3. Protected routes use `requireAuth` or `requireDeveloper` middleware to validate the token

### Middleware

| Middleware          | Guards                                     |
|---------------------|--------------------------------------------|
| `requireAuth`       | Any authenticated user                     |
| `requireDeveloper`  | Only users with `isDeveloper: true`         |

JWT Payload shape:
```ts
{ id: string, role: "user" | "developer", isDeveloper: boolean }
```

---

## 📊 Data Models

### User

| Field              | Type     | Description                                          |
|--------------------|----------|------------------------------------------------------|
| `name`             | String   | Full name                                            |
| `email`            | String   | Unique, lowercase                                    |
| `password`         | String   | Bcrypt-hashed (min 6 chars, excluded from queries by default) |
| `role`             | Enum     | `"user"` or `"developer"`                            |
| `isDeveloper`      | Boolean  | True once developer profile is created               |
| `developerStatus`  | Enum     | `"none"` / `"pending"` / `"approved"` / `"rejected"` |
| `developerProfile` | Object   | Nested profile (displayName, bio, avatar, skills, social links) |
| `googleId`         | String   | Set for Google OAuth users                           |
| `avatar`           | String   | Profile picture URL                                  |

### App (Project)

| Field             | Type    | Description                                       |
|-------------------|---------|---------------------------------------------------|
| `developerId`     | String  | Owner's user ID                                   |
| `slug`            | String  | Auto-generated URL-safe identifier from name      |
| `name`            | String  | Project name                                      |
| `shortDescription`| String  | Brief summary                                     |
| `description`     | String  | Full description                                  |
| `projectType`     | Enum    | `web-app`, `mobile-app`, `desktop-app`, `api-backend`, `library-package`, `cli-tool`, `ui-component`, `developer-tool` |
| `category`        | String  | e.g. Utilities, Productivity                      |
| `tags`            | String[]| Search tags                                       |
| `languages`       | String[]| Programming languages used                        |
| `frameworks`      | String[]| Frameworks used                                   |
| `status`          | Enum    | `draft` → `pending` → `published` / `rejected` / `archived` |
| `visibility`      | Enum    | `"private"` or `"public"`                         |
| `files`           | Array   | Uploaded file entries                             |
| `buildConfig`     | Object  | Runtime, package manager, build/start commands    |
| `envVars`         | Array   | AES-256 encrypted environment variables           |
| `importSource`    | Object  | ZIP / GitHub / Git import metadata                |
| `detectedTech`    | Object  | Auto-detected language, framework, build commands |
| `currentVersion`  | String  | Latest published version                          |
| `downloads`       | Number  | Total download count                              |
| `views`           | Number  | Total view count                                  |
| `rating`          | Number  | Average rating                                    |

### Release

| Field         | Type    | Description                            |
|---------------|---------|----------------------------------------|
| `projectId`   | String  | Reference to parent App                |
| `version`     | String  | Semantic version string (unique/project)|
| `title`       | String  | Release title                          |
| `releaseNotes`| String  | Human-readable notes                   |
| `changelog`   | String  | Detailed changelog                     |
| `channel`     | Enum    | `alpha` / `beta` / `stable`            |
| `status`      | Enum    | `draft` → `published`                  |
| `files`       | Array   | Uploaded release files                 |
| `publishedAt` | Date    | Timestamp when published               |

---

## 🛣️ API Routes Overview

See [`docs/API_REFERENCE.md`](../../docs/API_REFERENCE.md) for the full endpoint reference.

### Auth — `/api/auth`
| Method | Endpoint        | Auth | Description              |
|--------|-----------------|------|--------------------------|
| POST   | `/register`     | ❌   | Create a new account     |
| POST   | `/login`        | ❌   | Login with email/password|
| POST   | `/oauth`        | ❌   | Create/get OAuth user    |
| GET    | `/me`           | ✅   | Get current user info    |

### Developer — `/api/developer`
| Method | Endpoint        | Auth        | Description              |
|--------|-----------------|-------------|--------------------------|
| POST   | `/register`     | requireAuth | Upgrade to developer     |
| GET    | `/profile`      | requireDev  | Get developer profile    |
| PUT    | `/profile`      | requireDev  | Update developer profile |
| GET    | `/stats`        | requireDev  | Get aggregate stats      |

### Apps — `/api/developer/apps`
| Method | Endpoint                    | Auth       | Description                     |
|--------|-----------------------------|------------|---------------------------------|
| POST   | `/apps`                     | requireDev | Create new project              |
| GET    | `/apps`                     | requireDev | List all projects (filterable)  |
| GET    | `/apps/:id`                 | requireDev | Get single project              |
| PUT    | `/apps/:id`                 | requireDev | Update project metadata         |
| DELETE | `/apps/:id`                 | requireDev | Delete project                  |
| POST   | `/apps/:id/detect`          | requireDev | Auto-detect tech stack          |
| POST   | `/apps/:id/import`          | requireDev | Import from ZIP/GitHub/Git      |
| POST   | `/apps/:id/upload`          | requireDev | Upload project files            |
| POST   | `/apps/:id/cover`           | requireDev | Upload cover image              |
| POST   | `/apps/:id/env`             | requireDev | Add/update environment variable |
| GET    | `/apps/:id/env`             | requireDev | List (masked) env vars          |
| DELETE | `/apps/:id/env/:key`        | requireDev | Delete environment variable     |
| POST   | `/apps/:id/submit`          | requireDev | Submit app for review           |
| POST   | `/apps/:id/archive`         | requireDev | Archive a project               |

### Releases — `/api/developer/apps/:appId/releases`
| Method | Endpoint                | Auth       | Description                 |
|--------|-------------------------|------------|-----------------------------|
| POST   | `/`                     | requireDev | Create a new draft release  |
| GET    | `/`                     | requireDev | List all releases           |
| GET    | `/:releaseId`           | requireDev | Get single release          |
| PUT    | `/:releaseId`           | requireDev | Update release details      |
| POST   | `/:releaseId/upload`    | requireDev | Upload files to release     |
| PUT    | `/:releaseId/publish`   | requireDev | Publish release             |
| DELETE | `/:releaseId`           | requireDev | Delete draft release        |

### Public Apps — `/api/apps`
| Method | Endpoint      | Auth | Description                   |
|--------|---------------|------|-------------------------------|
| GET    | `/`           | ❌   | Browse published apps         |
| GET    | `/:slug`      | ❌   | Get app details by slug       |
| POST   | `/:slug/download` | ❌ | Increment download count    |

---

## 📦 File Upload

- **Engine**: Multer with disk storage
- **File size limit**: 500 MB per file
- **Storage path**: `./uploads/<userId>/` (configurable via `UPLOAD_DIR`)
- **Allowed types**: executables, installers, archives, documents, images, video, audio, source files
- **Cover images**: JPEG / PNG / GIF / WebP (10 MB limit)
- **File type detection**: Based on extension (exe → executable, dmg → installer, etc.)

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT tokens expire in **7 days**
- Environment variable values encrypted with **AES-256-CBC**
- `password` field excluded from all DB queries by default (`select: false`)
- CORS restricted to `CLIENT_URL` origin
