# 🌍 Environment Variables Reference

All environment variables required to run DUspace, documented in one place.

---

## 📦 `apps/api` — Express Backend

**File:** `apps/api/.env`  
**Template:** `apps/api/.env.example`

### Required Variables

| Variable      | Example Value | Description |
|---------------|---------------|-------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` | MongoDB Atlas connection string. Create a free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) |
| `JWT_SECRET`  | (32+ char random string) | Signs and verifies JWTs. Generate with: `openssl rand -base64 32` |
| `CLIENT_URL`  | `http://localhost:3000` | Frontend origin for CORS. In production: your Vercel/Render URL |

### Optional Variables

| Variable          | Default                  | Description |
|-------------------|--------------------------|-------------|
| `PORT`            | `5000`                   | Port the Express server listens on. Render sets this automatically |
| `UPLOAD_DIR`      | `./uploads`              | Filesystem path where uploaded files are stored |
| `ENV_ENCRYPTION_KEY` | `duspace-env-secret-key-32-chars!` | AES-256 key for encrypting project env var values. **Change this in production!** Must be exactly 32 characters |

### Full `.env` Example

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://duspace_user:yourpassword@yourcluster.mongodb.net/?appName=Duspace

# Secret for signing JWTs
JWT_SECRET=your-random-32-char-secret-here

# Port (Render sets this automatically)
PORT=5001

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000

# File upload directory
UPLOAD_DIR=./uploads

# AES-256 key for encrypting env var values (exactly 32 chars)
ENV_ENCRYPTION_KEY=duspace-secret-key-32-chars-here
```

---

## 🌐 `apps/web` — Next.js Frontend

**File:** `apps/web/.env.local`  
**Template:** `apps/web/.env.example`

### Required Variables

| Variable              | Example Value | Description |
|-----------------------|---------------|-------------|
| `NEXTAUTH_URL`        | `http://localhost:3000` | Full canonical URL of your web app. Required by NextAuth |
| `NEXTAUTH_SECRET`     | (32+ char random string) | Encrypts NextAuth session cookies. Generate with: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`    | `xxx.apps.googleusercontent.com` | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET`| `GOCSPX-...` | Google OAuth 2.0 client secret |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001` | Express API base URL. Exposed to the browser (no secrets here!) |

### Full `.env.local` Example

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-32-char-secret-here

# Google OAuth
# Setup: https://console.developers.google.com/
# Add redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# Express API base URL (public — safe to expose)
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## 🔧 Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **Google+ API** (or **People API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy `Client ID` and `Client Secret` into `.env.local`

---

## 🔒 Secrets Security Checklist

- [ ] `.env` and `.env.local` are in `.gitignore` ✅ (already configured)
- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] `NEXTAUTH_SECRET` is at least 32 random characters
- [ ] `ENV_ENCRYPTION_KEY` is exactly 32 characters (AES-256 requirement)
- [ ] Never commit real secrets — use environment variable injection in CI/CD
- [ ] In production, use platform-native secret management (Render Env Groups, Vercel Environment Variables)

---

## 🚀 Production Environment (Render + Vercel)

### API on Render

Set these in the Render dashboard under **Environment**:

```
MONGODB_URI         = <production atlas URI>
JWT_SECRET          = <generate new secret>
CLIENT_URL          = https://yourdomain.com
UPLOAD_DIR          = /opt/render/project/src/uploads
ENV_ENCRYPTION_KEY  = <generate 32-char key>
```

> `PORT` is automatically set by Render — do not set it manually.

### Web on Vercel

Set these in Vercel dashboard under **Settings → Environment Variables**:

```
NEXTAUTH_URL            = https://yourdomain.com
NEXTAUTH_SECRET         = <generate new secret>
GOOGLE_CLIENT_ID        = <your Google client ID>
GOOGLE_CLIENT_SECRET    = <your Google client secret>
NEXT_PUBLIC_API_URL     = https://your-api.onrender.com
```

## Project Analyzer worker

All analysis settings are optional:

| Variable | Default | Description |
| --- | --- | --- |
| ANALYSIS_MAX_SOURCE_MB | 20 | Maximum total source/config text loaded for static analysis |
| ANALYSIS_TIMEOUT_SECONDS | 180 | Per-analysis time limit |
| ANALYSIS_WORKER_CONCURRENCY | 1 | Queue workers in the API process, capped at four |
| ANALYSIS_MAX_ATTEMPTS | 3 | Stale worker recovery attempts |
| ANALYSIS_STALE_JOB_SECONDS | 900 | No-progress interval before a running job is recovered |

The API process runs the worker by default. A separate worker process must share the API's MongoDB and private project snapshot storage.

For production browser requests, set NEXT_PUBLIC_API_URL to the deployed API origin when building the frontend. Set CLIENT_URL to the deployed frontend origin, or CLIENT_URLS to a comma-separated list of allowed frontend origins. A browser cannot reach a developer machine's localhost from a deployed site.

See docs/PROJECT_ANALYZER_PHASE2.md for analysis endpoints, report schema, limits and current detection coverage.
