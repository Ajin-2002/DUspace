# 🚀 DUspace — Developer App Distribution Platform

DUspace is a full-stack **monorepo** platform where developers can publish, distribute, and manage their applications. Users can browse, download, and review apps from a centralized marketplace.

---

## 📁 Repository Structure

```
DUspace/
├── apps/
│   ├── api/          # Express + TypeScript REST API (backend)
│   ├── web/          # Next.js 16 frontend (user & developer portals)
│   ├── desktop/      # Desktop app (in progress)
│   └── mobile/       # Mobile app (in progress)
├── packages/
│   ├── api-client/   # Shared API client utilities
│   ├── config/       # Shared configuration
│   ├── hooks/        # Shared React hooks
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI component library
│   ├── utils/        # Shared utility functions
│   └── validation/   # Shared Zod validation schemas
├── docs/             # Documentation
├── scripts/          # Monorepo scripts
├── turbo.json        # Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json
```

---

## 🛠️ Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Monorepo   | Turborepo + pnpm workspaces                     |
| Backend    | Express 5, TypeScript, Mongoose, MongoDB Atlas  |
| Frontend   | Next.js 16, React 19, Tailwind CSS 4            |
| Auth       | NextAuth.js (Google OAuth + Credentials)        |
| State      | Zustand, TanStack Query                         |
| Forms      | React Hook Form + Zod                           |
| Animation  | Framer Motion                                   |
| Icons      | Lucide React                                    |
| File Upload| Multer (disk storage, 500MB limit)              |

---

## ⚡ Quick Start

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 10
- MongoDB Atlas account (or local MongoDB)

### 1. Install Dependencies

```bash
cd DUspace
pnpm install
```

### 2. Configure Environment Variables

**API** — copy `.env.example` to `.env` in `apps/api/`:
```bash
cp apps/api/.env.example apps/api/.env
```

**Web** — copy `.env.example` to `.env.local` in `apps/web/`:
```bash
cp apps/web/.env.example apps/web/.env.local
```

See [`apps/api/README.md`](./apps/api/README.md) and [`apps/web/README.md`](./apps/web/README.md) for all required variables.

### 3. Run All Apps (Development)

```bash
pnpm dev
```

Or run them individually:

```bash
# Terminal 1 — API (http://localhost:5001)
cd apps/api && pnpm dev

# Terminal 2 — Web (http://localhost:3000)
cd apps/web && pnpm dev
```

---

## 📜 Available Scripts (Root)

| Script          | Description                          |
|-----------------|--------------------------------------|
| `pnpm dev`      | Start all apps in development mode   |
| `pnpm build`    | Build all apps and packages          |
| `pnpm lint`     | Run ESLint across all apps           |
| `pnpm format`   | Format all TS/TSX/MD files           |
| `pnpm check-types` | TypeScript type-check all apps    |

---

## 📚 Documentation

| File | Description |
|------|-------------|
| [`apps/api/README.md`](./apps/api/README.md) | API server setup, routes, and environment |
| [`apps/web/README.md`](./apps/web/README.md) | Frontend setup, pages, and auth config |
| [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md) | Full REST API endpoint reference |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System architecture and data flow |
| [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Contribution guidelines |

---

## 🌐 Deployment

The project is configured for deployment on **Render** via [`render.yaml`](./render.yaml).

- **API** → Render Web Service
- **Web** → Vercel (recommended) or Render Static Site

---

## 📄 License

MIT © DUspace Team
