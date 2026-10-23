# 🏗️ DUspace — System Architecture

This document describes the overall architecture, data flow, and key design decisions of the DUspace platform.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                 │
│   ┌───────────────┐   ┌─────────────┐   ┌──────────────────┐   │
│   │  Web Browser  │   │ Desktop App │   │   Mobile App     │   │
│   │ (Next.js 16)  │   │  (Electron?)│   │  (React Native?) │   │
│   └───────┬───────┘   └──────┬──────┘   └────────┬─────────┘   │
└───────────┼──────────────────┼────────────────────┼─────────────┘
            │                  │                    │
            └──────────────────▼────────────────────┘
                               │ HTTPS REST API
                               │ (Authorization: Bearer JWT)
                    ┌──────────▼──────────┐
                    │   Express 5 API     │
                    │  (Node.js / TSX)    │
                    │   Port 5001         │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐  ┌──────▼──────┐  ┌─────▼──────────┐
    │  MongoDB Atlas │  │  ./uploads/ │  │  Google OAuth   │
    │  (Mongoose)    │  │  (Multer)   │  │  (via NextAuth) │
    └────────────────┘  └─────────────┘  └────────────────┘
```

---

## 🗂️ Monorepo Layout

DUspace uses **Turborepo** with **pnpm workspaces** to manage multiple apps and shared packages in a single repository.

```
DUspace/                         ← Monorepo root
├── apps/
│   ├── api/                     ← Express REST API (backend)
│   ├── web/                     ← Next.js web app (frontend)
│   ├── desktop/                 ← Desktop client (planned)
│   └── mobile/                  ← Mobile client (planned)
└── packages/
    ├── api-client/              ← Shared API client/fetcher
    ├── config/                  ← Shared config values
    ├── hooks/                   ← Shared React custom hooks
    ├── types/                   ← Shared TypeScript types
    ├── ui/                      ← Shared UI component library
    ├── utils/                   ← Shared utility functions
    └── validation/              ← Shared Zod validation schemas
```

### Why Turborepo?
- **Parallel execution**: runs `dev` and `build` tasks concurrently
- **Incremental builds**: skips unchanged apps/packages via caching
- **Task pipeline**: enforces build order (packages → apps)

---

## 🔄 Request / Data Flow

### User Authentication Flow

```
Browser                    Next.js (web)            Express API         MongoDB
   │                           │                         │                 │
   │── POST /api/auth/login ──▶│                         │                 │
   │   (via NextAuth)          │── POST /api/auth/login ▶│                 │
   │                           │                         │── findOne ──────▶│
   │                           │                         │◀── user ─────────│
   │                           │                         │── comparePassword│
   │                           │                         │── signJWT        │
   │                           │◀── { token, user } ─────│                 │
   │◀── session created ───────│                         │                 │
   │    (JWT stored in cookie) │                         │                 │
```

### Developer Project Creation Flow

```
Developer (browser)        Next.js           Express API          MongoDB
       │                      │                   │                  │
       │── Fill form ─────────│                   │                  │
       │── POST /developer/apps (with JWT) ───────▶│                  │
       │                      │                   │── verify JWT     │
       │                      │                   │── generateSlug   │
       │                      │                   │── new App() ─────▶│
       │                      │                   │◀── saved app ─────│
       │◀──────── { app } ─────────────────────────│                  │
       │── Upload ZIP ────────────────────────────▶│                  │
       │                      │                   │── multer storage  │
       │                      │                   │── detect tech ───▶│ (update app)
       │◀──────── { detected } ────────────────────│                  │
       │── Configure build ───────────────────────▶│                  │
       │── Create release ────────────────────────▶│                  │
       │── Upload release files ──────────────────▶│                  │
       │── Publish release ───────────────────────▶│                  │
       │                      │                   │── app.status = "published"
       │◀──────── { publicUrl } ───────────────────│                  │
```

---

## 🔐 Authentication Architecture

### JWT Strategy

- JWTs are signed with `JWT_SECRET` and expire in **7 days**
- Payload: `{ id, role, isDeveloper }`
- The **Express API** validates JWTs directly — it does **not** use sessions
- **NextAuth.js** on the frontend manages the session cookie and stores the API JWT inside it

### NextAuth + Express Bridge

```
Browser  ──▶  NextAuth (Next.js)  ──▶  Express /api/auth/login
                    │                          │
                    │◀── API JWT ───────────────│
                    │
                    │ stores API JWT in NextAuth session
                    │
Browser  ──▶  Protected Page
              session.user.token  ──▶  sent to Express as Bearer token
```

### Role System

| Role        | `role` field    | `isDeveloper` | Access                        |
|-------------|-----------------|---------------|-------------------------------|
| Regular user| `"user"`        | `false`       | User dashboard, app store     |
| Developer   | `"developer"`   | `true`        | All above + developer portal  |

---

## 📊 Database Design (MongoDB / Mongoose)

### Collections

| Collection  | Description                              |
|-------------|------------------------------------------|
| `users`     | All user accounts including dev profiles |
| `apps`      | Projects/apps created by developers      |
| `releases`  | Release versions for each app            |

### Key Relationships

```
User (1) ────── (M) App       via App.developerId = User._id
App  (1) ────── (M) Release   via Release.projectId = App._id
```

### Indexing Strategy

- `App.developerId` — indexed (fast lookup of a developer's apps)
- `App.slug` — indexed (fast public URL resolution)
- `Release.projectId` — indexed (fast lookup of an app's releases)
- `Release.(projectId + version)` — **unique compound index** (prevents duplicate versions per app)
- `User.email` — unique index
- `User.googleId` — sparse index (only set for OAuth users)

---

## 📁 File Storage

Files are stored on **local disk** in development and production (configurable via `UPLOAD_DIR`).

```
uploads/
└── <userId>/
    ├── 1736000000000-123456789.zip     ← project source ZIP
    ├── 1736000000001-987654321.exe     ← release executable
    └── 1736000000002-456789123.png     ← cover image
```

Files are served statically from `GET /uploads/:path`.

### File Type Detection

The API detects file types from extension:

| Extension                | Detected Type  |
|--------------------------|---------------|
| `.exe`, `.dll`, `.app`, `.bin` | `executable` |
| `.msi`, `.dmg`, `.pkg`, `.deb`, `.rpm` | `installer` |
| `.zip`, `.rar`, `.7z`, `.tar`, `.gz` | `archive` |
| `.pdf`, `.doc`, `.docx` | `document` |
| Images, video, audio | `media` |
| `.js`, `.ts`, `.py`, `.java`, etc. | `source` |

### Future: Cloud Storage

The `UPLOAD_DIR` abstraction is designed to be replaced with S3/GCS. The URL structure (`/uploads/...`) would remain the same via a CDN proxy.

---

## 🔒 Security Design

### Secrets & Encryption

| Data                   | Protection                                  |
|------------------------|---------------------------------------------|
| Passwords              | bcrypt (12 rounds)                          |
| JWT signing            | HMAC-SHA256 with `JWT_SECRET`               |
| Env var values         | AES-256-CBC encryption with `ENV_ENCRYPTION_KEY` |
| Env var display        | Values are masked on read (`po••••••rd`)    |

### CORS

The Express API allows requests only from `CLIENT_URL` (configured in `.env`). In production this should be the Vercel/Render domain.

### Middleware Order

```
Request
  │
  ├── cors()
  ├── express.json()
  ├── express.urlencoded()
  ├── express.static('/uploads')
  │
  ├── /api/auth/*     (public — no auth required)
  ├── /api/apps/*     (public — read-only)
  │
  ├── requireAuth     (validates JWT)
  │   └── /api/auth/me
  │
  └── requireDeveloper (validates JWT + isDeveloper)
      ├── /api/developer/*
      └── /api/developer/apps/*
```

---

## 🚀 Deployment Architecture

### Current Setup (Render)

Configured in `render.yaml`:

| Service     | Platform | Type              |
|-------------|----------|-------------------|
| `api`       | Render   | Web Service (Node)|
| `web`       | Vercel   | Next.js (edge)    |

### Environment Configuration per Environment

| Variable         | Local              | Production              |
|------------------|--------------------|-------------------------|
| `MONGODB_URI`    | Atlas (shared)     | Atlas (production)      |
| `CLIENT_URL`     | `localhost:3000`   | `https://duspace.app`   |
| `NEXT_PUBLIC_API_URL` | `localhost:5001` | Render service URL   |
| `NEXTAUTH_URL`   | `localhost:3000`   | `https://duspace.app`   |

---

## 📈 App Lifecycle / State Machine

```
         ┌──────────┐
    ──── │  draft   │ ◀────────────────────────────────┐
         └────┬─────┘                                   │
              │ developer submits for review            │
              ▼                                         │
         ┌──────────┐                                   │
         │ pending  │                                   │
         └────┬─────┘                                   │
         ┌────┴─────┐                                   │
         │          │                                   │
         ▼          ▼                                   │
    ┌──────────┐ ┌──────────┐                          │
    │published │ │ rejected │────────────────────────▶(can be re-submitted)
    └────┬─────┘ └──────────┘
         │ developer archives
         ▼
    ┌──────────┐
    │ archived │
    └──────────┘
```

**Release Lifecycle:**
```
draft ──▶ published
```
(Published releases cannot be edited or deleted)
