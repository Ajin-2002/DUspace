# 🌐 DUspace Web — Next.js Frontend

The web app is the primary user-facing portal for DUspace. It contains two distinct portals in one Next.js application:

- **User Portal** (`/dashboard`) — browse apps, manage downloads, reviews, favorites
- **Developer Portal** (`/developer`) — manage projects, releases, analytics, profile

---

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/                         # Next.js App Router pages
│   │   ├── page.tsx                 # Landing page (homepage)
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles + Tailwind base
│   │   ├── login/                   # Login page
│   │   ├── register/                # Register page
│   │   ├── apps/                    # Public app store (browse/discover)
│   │   ├── dashboard/               # User dashboard (authenticated)
│   │   │   ├── page.tsx             # Dashboard home
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── user-sidebar.tsx     # User navigation sidebar
│   │   │   ├── downloads/           # Downloaded apps
│   │   │   ├── favorites/           # Favorited apps
│   │   │   ├── my-apps/             # Installed apps
│   │   │   ├── reviews/             # User reviews
│   │   │   ├── billing/             # Billing & subscription
│   │   │   ├── settings/            # User account settings
│   │   │   ├── support/             # Help & support
│   │   │   └── developer-space/     # Gateway to developer registration
│   │   └── developer/               # Developer portal (developer role required)
│   │       ├── page.tsx             # Developer dashboard home
│   │       ├── layout.tsx           # Developer layout with sidebar
│   │       ├── developer-sidebar.tsx# Developer navigation sidebar
│   │       ├── projects/            # Project management
│   │       │   ├── page.tsx         # Projects list
│   │       │   ├── new/             # Create new project
│   │       │   └── [id]/            # Single project detail
│   │       │       ├── page.tsx     # Project overview
│   │       │       ├── layout.tsx   # Project sub-navigation
│   │       │       ├── analytics/   # Project analytics
│   │       │       ├── configure/   # Build config & env vars
│   │       │       ├── deployments/ # Deployment history
│   │       │       ├── detect/      # Tech detection wizard
│   │       │       ├── import/      # Import from ZIP/GitHub
│   │       │       ├── releases/    # Release list
│   │       │       │   ├── new/     # Create new release
│   │       │       │   └── [releaseId]/publish/ # Publish a release
│   │       │       ├── review/      # Submit for review
│   │       │       ├── reviews/     # User reviews of this app
│   │       │       ├── analyze/     # Security/quality analysis
│   │       │       └── settings/    # Project settings
│   │       ├── analytics/           # Cross-project analytics
│   │       ├── earnings/            # Revenue & earnings
│   │       ├── notifications/       # Developer notifications
│   │       ├── profile/             # Developer profile editor
│   │       ├── releases/            # Cross-project release list
│   │       ├── settings/            # Developer account settings
│   │       └── submit/              # App submission flow
│   ├── components/
│   │   ├── ui/                      # Core UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── social-button.tsx    # OAuth login button
│   │   │   └── file-upload.tsx      # Drag-and-drop file uploader
│   │   ├── auth/                    # Auth-specific components
│   │   ├── developer/               # Developer portal components
│   │   ├── layout/                  # Layout components (nav, footer)
│   │   └── zip-upload.tsx           # ZIP file upload with progress
│   ├── lib/
│   │   ├── api.ts                   # API base URL helper
│   │   ├── auth.ts                  # NextAuth configuration
│   │   ├── theme.ts                 # Theme utilities
│   │   └── utils.ts                 # General utilities (cn, etc.)
│   ├── providers/                   # React context providers
│   ├── types/
│   │   └── next-auth.d.ts           # NextAuth session type augmentation
│   └── proxy.ts                     # Next.js middleware (route protection)
├── .env.local                       # Local environment variables
├── .env.example                     # Environment variable template
├── next.config.ts                   # Next.js configuration
├── tailwind.config (inline)         # Tailwind CSS 4 config
└── package.json
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable                | Required | Description                                          |
|-------------------------|----------|------------------------------------------------------|
| `NEXTAUTH_URL`          | ✅       | Full URL of the web app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET`       | ✅       | Random secret for NextAuth. Use `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`      | ✅       | Google OAuth client ID                               |
| `GOOGLE_CLIENT_SECRET`  | ✅       | Google OAuth client secret                           |
| `NEXT_PUBLIC_API_URL`   | ✅       | URL of the Express API (e.g. `http://localhost:5001`) |

> **Google OAuth setup**: Go to [Google Cloud Console](https://console.developers.google.com/), create OAuth 2.0 credentials, and add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

---

## 🚀 Running the Web App

### Development
```bash
pnpm dev
# Starts Next.js dev server at http://localhost:3000
```

### Production Build
```bash
pnpm build
pnpm start
```

---

## 🔐 Authentication

Authentication is handled by **NextAuth.js** with two providers:

### 1. Credentials (Email + Password)
- User submits email/password
- NextAuth calls `POST /api/auth/login` on the Express API
- On success, the API JWT is stored in the NextAuth session token

### 2. Google OAuth
- User clicks "Sign in with Google"
- After Google callback, NextAuth calls `POST /api/auth/oauth` on the Express API
- The backend creates the user if not found, returns a JWT
- JWT is stored in the NextAuth session

### Session Structure

After sign-in, `session.user` contains:

```ts
{
  id: string;
  name: string;
  email: string;
  role: "user" | "developer";
  isDeveloper: boolean;
  developerStatus: "none" | "pending" | "approved" | "rejected";
  developerProfile?: DeveloperProfile;
  token: string; // API JWT for authorized requests
}
```

### Route Protection (Middleware)

`src/proxy.ts` (Next.js middleware) protects routes:

| Route Pattern        | Rule                                              |
|----------------------|---------------------------------------------------|
| `/dashboard/*`       | Must be authenticated (any role)                  |
| `/developer/*`       | Must be authenticated AND have `role: "developer"` |
| `/settings/*`        | Must be authenticated                             |

Unauthenticated users are redirected to `/login`. Regular users accessing `/developer/*` are redirected to `/dashboard`.

---

## 📄 Pages Reference

### Public Pages

| Route         | Description                          |
|---------------|--------------------------------------|
| `/`           | Landing page with featured apps      |
| `/login`      | Sign-in page (email + Google)        |
| `/register`   | Account creation page                |
| `/apps`       | Public app store / browse            |
| `/apps/:slug` | Individual app detail page           |

### User Dashboard (`/dashboard`)

| Route                    | Description                          |
|--------------------------|--------------------------------------|
| `/dashboard`             | Dashboard home (overview/stats)      |
| `/dashboard/downloads`   | List of downloaded apps              |
| `/dashboard/favorites`   | Saved/favorited apps                 |
| `/dashboard/my-apps`     | Installed/owned apps                 |
| `/dashboard/reviews`     | Apps the user has reviewed           |
| `/dashboard/billing`     | Subscription and billing info        |
| `/dashboard/settings`    | Account settings                     |
| `/dashboard/support`     | Help center / support tickets        |
| `/dashboard/developer-space` | Register as a developer          |

### Developer Portal (`/developer`)

| Route                                            | Description                           |
|--------------------------------------------------|---------------------------------------|
| `/developer`                                     | Developer dashboard (stats, projects) |
| `/developer/profile`                             | Edit developer profile                |
| `/developer/projects`                            | All projects list                     |
| `/developer/projects/new`                        | Create new project wizard             |
| `/developer/projects/:id`                        | Project overview                      |
| `/developer/projects/:id/import`                 | Import from ZIP / GitHub / Git        |
| `/developer/projects/:id/detect`                 | Auto-detect tech stack                |
| `/developer/projects/:id/configure`              | Build config & environment variables  |
| `/developer/projects/:id/releases`               | Releases list                         |
| `/developer/projects/:id/releases/new`           | Create a new release                  |
| `/developer/projects/:id/releases/:rid/publish`  | Publish a release                     |
| `/developer/projects/:id/analytics`              | App analytics                         |
| `/developer/projects/:id/review`                 | Submit for app review                 |
| `/developer/projects/:id/reviews`                | User reviews of this app              |
| `/developer/projects/:id/deployments`            | Deployment history                    |
| `/developer/projects/:id/analyze`                | Security/quality analysis             |
| `/developer/projects/:id/settings`               | Project settings                      |
| `/developer/analytics`                           | Cross-project analytics               |
| `/developer/earnings`                            | Earnings & revenue                    |
| `/developer/releases`                            | Cross-project releases list           |
| `/developer/notifications`                       | Developer notifications               |
| `/developer/settings`                            | Developer account settings            |

---

## 🧩 Key Components

### `FileUpload` (`components/ui/file-upload.tsx`)
A drag-and-drop file uploader with:
- Configurable accepted file types
- Max file size validation
- Upload progress tracking
- Multiple file support

### `ZipUpload` (`components/zip-upload.tsx`)
Specialized ZIP file uploader that:
- Accepts `.zip` archives
- Shows upload progress
- Triggers tech auto-detection after upload

### `SocialButton` (`components/ui/social-button.tsx`)
OAuth provider login buttons (Google, GitHub, etc.) with loading states.

### `Badge` (`components/ui/badge.tsx`)
Status badge component with variants for: `draft`, `published`, `pending`, `rejected`, `archived`.

---

## 🔄 API Communication

The web app communicates with the Express API using:

```ts
// lib/api.ts
export function getApiUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}
```

All authenticated requests include the JWT from the session:
```ts
headers: { Authorization: `Bearer ${session.user.token}` }
```
