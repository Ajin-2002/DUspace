# 🤝 Contributing to DUspace

Thank you for your interest in contributing! This guide walks you through the development setup, workflow, and conventions for the DUspace monorepo.

---

## 🚀 Getting Started

### 1. Prerequisites

| Tool       | Version   | Notes                       |
|------------|-----------|-----------------------------|
| Node.js    | ≥ 18      | Use [nvm](https://github.com/nvm-sh/nvm) for version management |
| pnpm       | ≥ 10      | `npm install -g pnpm`       |
| MongoDB    | Atlas or local | Connection string required |

### 2. Fork & Clone

```bash
git clone https://github.com/your-org/DUspace.git
cd DUspace
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment

```bash
# API environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your MongoDB URI and JWT secret

# Web environment
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your NextAuth and Google OAuth credentials
```

### 5. Start Development Servers

```bash
# Start all apps
pnpm dev

# Or individually:
cd apps/api && pnpm dev   # http://localhost:5001
cd apps/web && pnpm dev   # http://localhost:3000
```

---

## 🌿 Branching Strategy

| Branch Pattern         | Purpose                        |
|------------------------|--------------------------------|
| `main`                 | Production-ready code          |
| `dev`                  | Integration branch for features|
| `feature/<name>`       | New feature development        |
| `fix/<name>`           | Bug fixes                      |
| `chore/<name>`         | Tooling, deps, non-feature work|
| `docs/<name>`          | Documentation updates          |

### Workflow

```
feature/my-feature ──▶ dev ──▶ main
```

1. Branch off `dev`: `git checkout -b feature/my-feature dev`
2. Make your changes
3. Open a PR targeting `dev`
4. After review and merge, `dev` is periodically merged to `main` for releases

---

## 📝 Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type       | When to use                                     |
|------------|-------------------------------------------------|
| `feat`     | New feature                                     |
| `fix`      | Bug fix                                         |
| `docs`     | Documentation changes                           |
| `style`    | Formatting, missing semicolons (no logic change)|
| `refactor` | Code restructuring (no feature/fix)             |
| `test`     | Adding or fixing tests                          |
| `chore`    | Build process, dependency updates               |
| `perf`     | Performance improvements                        |

### Scope Examples

`api`, `web`, `auth`, `apps`, `releases`, `ui`, `models`, `middleware`

### Examples

```
feat(api): add virus scan middleware for uploaded files
fix(web): correct redirect after Google OAuth sign-in
docs(api): add release endpoints to API reference
chore(deps): update mongoose to 9.7.3
```

---

## 📁 Code Style & Conventions

### TypeScript

- **Strict mode** enabled on both `api` and `web`
- Use explicit return types on all exported functions
- Prefer `interface` over `type` for object shapes (unless union/intersection needed)
- All models should have a corresponding `I<Model>` interface

### API (Express)

- Route handlers must return `Promise<void>` and use early returns after sending a response
- Always use `requireAuth` or `requireDeveloper` middleware for protected routes
- Use `req.userId` (set by middleware) — never trust user-provided IDs for ownership checks
- Wrap all route handlers in try/catch, log errors with `console.error`

```ts
// ✅ Good
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await Model.findById(req.params.id);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    if (item.ownerId !== req.userId) { res.status(403).json({ error: "Unauthorized" }); return; }
    res.json({ item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
```

### Web (Next.js)

- Use **App Router** (`src/app/`) — no Pages Router
- Use **Server Components** by default; add `"use client"` only when needed
- Place API calls in separate service files or use TanStack Query hooks
- Use `session.user.token` for all authenticated API calls

```ts
// ✅ Authenticated fetch
const res = await fetch(getApiUrl("/api/developer/apps"), {
  headers: { Authorization: `Bearer ${session.user.token}` },
});
```

### Styling

- Use **Tailwind CSS 4** utility classes
- Complex, reusable styles should be extracted into component classes
- No inline styles unless absolutely necessary

---

## 🧪 Testing

> Tests are not yet set up in the project. Contributions to add test infrastructure are very welcome!

**Recommended setup (open for contribution):**
- **API**: Jest + Supertest for route testing, Vitest for unit testing
- **Web**: Vitest + React Testing Library for component tests

---

## 🔧 Adding a New API Route

1. Identify the correct router file in `apps/api/src/routes/`
2. Add your route handler following the pattern above
3. Mount the router in `apps/api/src/index.ts` if it's a new router file
4. Document the endpoint in [`docs/API_REFERENCE.md`](./API_REFERENCE.md)
5. If a new model is needed, create it in `apps/api/src/models/`

---

## 🖥️ Adding a New Web Page

1. Create a new directory under `apps/web/src/app/` following Next.js App Router conventions
2. Create `page.tsx` (and optionally `layout.tsx`) inside it
3. If the page needs auth protection, ensure the route pattern is covered in `src/proxy.ts`
4. Add the page to the Pages Reference in [`apps/web/README.md`](../apps/web/README.md)

---

## 📦 Adding a Shared Package

1. Create a new directory under `packages/<name>/`
2. Add a `package.json` with name `@repo/<name>`
3. Add to `pnpm-workspace.yaml` if not using glob
4. Import in apps using `@repo/<name>`

---

## 🐛 Reporting Issues

When filing a bug report, include:

- **Environment**: OS, Node version, pnpm version
- **Steps to reproduce**
- **Expected behavior** vs **actual behavior**
- **Relevant logs** (redact sensitive values!)
- **Screenshots** (if UI issue)

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the **MIT License**.
