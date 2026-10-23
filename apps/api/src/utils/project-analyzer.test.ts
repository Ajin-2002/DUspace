import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AnalysisInputFile, analyzeProject, validateAnalysisInventoryFile, validateBlueprintShape } from "./project-analyzer";

function file(path: string, content: string): AnalysisInputFile {
  return { path, size: Buffer.byteLength(content), sha256: "a".repeat(64), content };
}

async function analyze(files: AnalysisInputFile[]) {
  const stages = new Set<string>();
  return analyzeProject(
    "65a000000000000000000001",
    1,
    files,
    async (stage) => { stages.add(stage); },
    async () => undefined,
  ).then((result) => ({ ...result, stages }));
}

describe("project analyzer", () => {
  it("detects Next.js App Router routes, layouts, JSX components and Tailwind from evidence", async () => {
    const result = await analyze([
      file("package.json", JSON.stringify({
        dependencies: { next: "15.1.0", react: "^19.0.0", tailwindcss: "^4.0.0" },
        devDependencies: { typescript: "^5.0.0" },
        scripts: { build: "next build" },
      })),
      file("package-lock.json", JSON.stringify({
        lockfileVersion: 3,
        packages: { "": {}, "node_modules/next": { version: "15.1.2" } },
      })),
      file("src/app/layout.tsx", "export default function RootLayout({ children }) { return <html>{children}</html>; }"),
      file("src/app/dashboard/page.tsx", "export default function Dashboard() { return <main><button onClick={() => {}}>Open</button></main>; }"),
      file("src/components/Sidebar.tsx", "export function Sidebar() { return <aside />; }"),
    ]);
    assert.equal(result.blueprint.summary.primaryFramework, "Next.js");
    assert.equal(result.blueprint.dependencies.lockfile, "package-lock.json");
    assert.equal(result.blueprint.dependencies.packageManager, "npm");
    assert.equal(result.blueprint.dependencies.direct.find((item) => item.name === "next")?.version, "15.1.2");
    assert.deepEqual(result.blueprint.architecture.routes.map((route) => route.path), ["/dashboard"]);
    assert.deepEqual(result.blueprint.architecture.layouts, ["src/app/layout.tsx"]);
    assert.ok(result.blueprint.uiInventory.components.some((item) => item.name === "Sidebar" && item.role === "navigation"));
    assert.deepEqual(result.blueprint.uiInventory.stylingSystems, ["Tailwind CSS"]);
    assert.ok(result.stages.has("quality_checks"));
    assert.equal(validateBlueprintShape(result.blueprint), true);
  });

  it("detects React with Vite and extracts declared and observed dependencies", async () => {
    const result = await analyze([
      file("package.json", JSON.stringify({ dependencies: { react: "^18", vite: "^5", axios: "^1" } })),
      file("src/main.tsx", "import React from 'react'; import axios from 'axios'; export function App() { return <form><input /></form>; }"),
    ]);
    assert.ok(result.blueprint.technologies.some((item) => item.name === "React with Vite"));
    assert.ok(result.blueprint.dependencies.direct.some((item) => item.name === "axios" && item.version === "^1"));
    assert.ok(result.blueprint.dependencies.observedImports.includes("react"));
    assert.equal(result.blueprint.uiInventory.forms.length, 1);
  });

  it("extracts Vue Router and Angular route objects only when the router dependency is present", async () => {
    const vue = await analyze([
      file("package.json", JSON.stringify({ dependencies: { vue: "^3", "vue-router": "^4" } })),
      file("src/router.ts", "import { createRouter } from 'vue-router'; export const router = createRouter({ routes: [{ path: '/', component: Home }, { path: '/settings/:id', component: Settings }] });"),
    ]);
    assert.deepEqual(vue.blueprint.architecture.routes.map((route) => route.path), ["/", "/settings/:id"]);
    assert.ok(vue.blueprint.architecture.routes.every((route) => route.framework === "Vue Router"));

    const angular = await analyze([
      file("package.json", JSON.stringify({ dependencies: { "@angular/core": "^20", "@angular/router": "^20" } })),
      file("src/app.routes.ts", "import { Routes } from '@angular/router'; export const routes: Routes = [{ path: 'home', component: Home }, { path: 'admin', loadChildren: () => import('./admin/routes') }];"),
    ]);
    assert.deepEqual(angular.blueprint.architecture.routes.map((route) => route.path), ["home", "admin"]);
    assert.ok(angular.blueprint.architecture.routes.every((route) => route.framework === "Angular Router"));
  });

  it("detects Next.js Pages Router files and common API pages", async () => {
    const result = await analyze([
      file("package.json", JSON.stringify({ dependencies: { next: "^14", react: "^18" } })),
      file("src/pages/index.tsx", "export default function Home() { return <main />; }"),
      file("src/pages/api/health.ts", "export default function handler() { return { ok: true }; }"),
    ]);
    assert.deepEqual(result.blueprint.architecture.routes.map((item) => [item.path, item.type]), [
      ["/", "page"],
      ["/api/health", "api"],
    ]);
  });

  it("extracts static Express route registrations without running source", async () => {
    const result = await analyze([
      file("package.json", JSON.stringify({ dependencies: { express: "^5" } })),
      file("src/server.ts", "const app = express(); app.get('/health', handler); app.post('/api/users', handler);"),
    ]);
    assert.ok(result.blueprint.technologies.some((item) => item.name === "Express"));
    assert.deepEqual(result.blueprint.architecture.apiEndpoints.map((item) => item.path), ["/health", "/api/users"]);
  });

  it("detects FastAPI and statically declared Python routes", async () => {
    const result = await analyze([
      file("requirements.txt", "fastapi==0.115.0\nuvicorn>=0.30"),
      file("main.py", "from fastapi import FastAPI\napp = FastAPI()\n@app.get('/items')\ndef items(): return []"),
    ]);
    assert.ok(result.blueprint.technologies.some((item) => item.name === "FastAPI"));
    assert.ok(result.blueprint.architecture.routes.some((item) => item.path === "/items" && item.framework === "Python web route"));
    assert.ok(result.blueprint.dependencies.direct.some((item) => item.name === "uvicorn"));
  });

  it("detects Django from Python dependency evidence and supports mixed frameworks", async () => {
    const django = await analyze([
      file("pyproject.toml", "[project]\ndependencies = ['Django>=5']"),
      file("urls.py", "urlpatterns = [path('admin/', admin.site.urls)]"),
    ]);
    assert.ok(django.blueprint.technologies.some((item) => item.name === "Django"));
    assert.ok(django.blueprint.architecture.routes.some((item) => item.path === "admin/"));
    assert.ok(django.blueprint.dependencies.direct.some((item) => item.name === "Django" && item.version === "5"));
    const mixed = await analyze([
      file("package.json", JSON.stringify({ dependencies: { next: "^15", express: "^5", react: "^19" } })),
      file("src/app/page.tsx", "export default function Page() { return <main />; }"),
      file("src/server.ts", "app.get('/health', handler);"),
    ]);
    assert.ok(mixed.blueprint.technologies.some((item) => item.name === "Next.js"));
    assert.ok(mixed.blueprint.technologies.some((item) => item.name === "Express"));
  });

  it("detects Laravel from composer dependencies and extracts route declarations", async () => {
    const result = await analyze([
      file("composer.json", JSON.stringify({ require: { "laravel/framework": "^11.0" } })),
      file("routes/web.php", "Route::get('/dashboard', [DashboardController::class, 'index']);"),
    ]);
    assert.ok(result.blueprint.technologies.some((item) => item.name === "Laravel"));
    assert.ok(result.blueprint.architecture.routes.some((item) => item.path === "/dashboard"));
  });

  it("labels plain HTML and leaves unsupported projects unclassified", async () => {
    const html = await analyze([file("index.html", "<main>Hello</main>"), file("styles.css", "body { color: black }")]);
    assert.equal(html.blueprint.summary.primaryFramework, "Static HTML");
    assert.ok(html.blueprint.uiInventory.stylingSystems.includes("CSS stylesheets"));
    const unknown = await analyze([file("notes.txt", "No source here")]);
    assert.equal(unknown.blueprint.summary.primaryFramework, null);
    assert.equal(unknown.blueprint.inventory.fileCount, 1);
  });

  it("redacts possible secrets and source contents from the generated report", async () => {
    const secret = "RealSecret_9137_Value";
    const result = await analyze([
      file("package.json", JSON.stringify({ scripts: { deploy: "deploy --api-key=RealSecret_9137_Value" } })),
      file("src/config.ts", "const api_key = '" + secret + "';\nexport const config = {}"),
    ]);
    assert.ok(result.findings.some((finding) => finding.title === "Possible hard-coded secret"));
    assert.equal(JSON.stringify(result.blueprint).includes(secret), false);
    assert.equal(JSON.stringify(result.findings).includes(secret), false);
  });

  it("reports authentication references and environment variable names without storing their values", async () => {
    const result = await analyze([
      file("package.json", JSON.stringify({ dependencies: { jose: "^5" } })),
      file("src/auth.ts", "const key = process.env.AUTH_SECRET; export function authorize(request) { return verify(request, key); }"),
    ]);
    assert.ok(result.blueprint.architecture.authenticationPatterns.some((item) => item.evidence.some((proof) => proof.includes("jose"))));
    assert.ok(result.blueprint.architecture.environmentVariables.includes("AUTH_SECRET"));
    assert.equal(JSON.stringify(result.blueprint).includes("process.env.AUTH_SECRET"), false);
  });

  it("records syntax problems as incomplete analysis and reports malformed package metadata", async () => {
    const result = await analyze([
      file("package.json", "{ invalid json"),
      file("src/broken.tsx", "export function Broken( { return <div>"),
    ]);
    assert.equal(result.blueprint.metadata.status, "incomplete");
    assert.ok(result.findings.some((finding) => finding.title === "Package manifest could not be parsed"));
    assert.ok(result.findings.some((finding) => finding.title === "Source file has a parse error"));
    assert.equal(validateBlueprintShape(result.blueprint), true);
  });

  it("rejects inventory paths that escape the project and unknown blueprint fields", async () => {
    const result = await analyze([file("src/page.tsx", "export function Page() { return <main />; }")]);
    const unsafeFile = { ...result.inventoryFiles[0], path: "../outside.ts" };
    assert.equal(validateAnalysisInventoryFile(unsafeFile), false);
    const extended = { ...result.blueprint, unrecognized: true };
    assert.equal(validateBlueprintShape(extended), false);
  });

  it("never evaluates uploaded JavaScript", async () => {
    const marker = "__duSpaceUploadedCodeRan";
    delete (globalThis as Record<string, unknown>)[marker];
    const result = await analyze([file("src/never-run.js", "globalThis." + marker + " = true;")]);
    assert.equal((globalThis as Record<string, unknown>)[marker], undefined);
    assert.equal(result.blueprint.inventory.fileCount, 1);
  });
});
