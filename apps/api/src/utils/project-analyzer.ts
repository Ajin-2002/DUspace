import path from "path";
import ts from "typescript";
import { ProjectBlueprintData } from "../models/ProjectBlueprint";
import { AnalysisStage } from "../models/ProjectAnalysisJob";

export interface AnalysisInputFile {
  path: string;
  size: number;
  sha256: string;
  content?: string;
  contentUnavailableReason?: "size" | "limit" | "binary";
}

export interface AnalysisFindingDraft {
  category: "security" | "quality" | "configuration" | "dependency";
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  fileReference?: string;
  lineStart?: number;
  lineEnd?: number;
  evidenceType: "confirmed" | "inferred";
  confidence: number;
  remediation?: string;
}

export interface ProjectAnalysisResult {
  blueprint: ProjectBlueprintData;
  findings: AnalysisFindingDraft[];
  inventoryFiles: AnalysisInventoryFile[];
}

export type AnalysisProgress = (stage: AnalysisStage, completed: number, total: number) => Promise<void>;

export type AnalysisInventoryFile = {
  path: string;
  extension: string;
  category: string;
  size: number;
  sha256: string;
  parseStatus: "parsed" | "skipped_binary" | "skipped_size" | "unsupported" | "parse_error";
};
type InventoryFile = AnalysisInventoryFile;
type RouteEntry = ProjectBlueprintData["architecture"]["routes"][number];
type UiEntry = ProjectBlueprintData["uiInventory"]["components"][number];
type ParsedFile = {
  source: ts.SourceFile;
  imports: string[];
  components: Array<{ name: string; exported: boolean }>;
  routeCalls: Array<{ method: string; route: string }>;
  routeElements: string[];
  staticRoutePaths: string[];
  envNames: Set<string>;
  hasHandlers: boolean;
  hasForms: boolean;
};

const MAX_SOURCE_FILE_BYTES = 512 * 1024;
const SOURCE_EXTENSIONS = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".vue", ".html",
  ".css", ".scss", ".sass", ".less", ".py", ".php", ".go", ".rs", ".java", ".kt", ".rb", ".sql", ".prisma",
]);
const CONFIG_NAMES = new Set([
  "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "tsconfig.json", "jsconfig.json",
  "angular.json", "composer.json", "pyproject.toml", "requirements.txt", "cargo.toml", "go.mod",
  "dockerfile", "eslint.config.js", "tailwind.config.js",
  "tailwind.config.ts", "postcss.config.js",
]);
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript", ".mts": "TypeScript", ".cts": "TypeScript",
  ".js": "JavaScript", ".jsx": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript",
  ".py": "Python", ".php": "PHP", ".go": "Go", ".rs": "Rust", ".java": "Java", ".kt": "Kotlin",
  ".rb": "Ruby", ".html": "HTML", ".css": "CSS", ".scss": "SCSS", ".sass": "Sass", ".less": "Less", ".sql": "SQL",
};
const LOCKFILES = [
  "pnpm-lock.yaml", "yarn.lock", "package-lock.json", "bun.lockb", "bun.lock", "poetry.lock",
  "Pipfile.lock", "composer.lock", "Cargo.lock", "go.sum",
];

function extension(filePath: string): string {
  return path.posix.extname(filePath).toLowerCase();
}

function basename(filePath: string): string {
  return path.posix.basename(filePath).toLowerCase();
}

function category(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (/(^|\/)(__tests__|tests?|spec)(\/|\.|$)/.test(lower) || /\.(test|spec)\.[^.]+$/.test(lower)) return "test";
  if (CONFIG_NAMES.has(basename(filePath)) || basename(filePath).startsWith(".env")) return "configuration";
  if (/\.(md|mdx|rst|adoc|txt)$/.test(lower) || /(^|\/)(readme|changelog|license)(\.|$)/.test(lower)) return "documentation";
  if (SOURCE_EXTENSIONS.has(extension(filePath))) return "source";
  if (/\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|mp[34]|pdf|zip)$/.test(lower)) return "asset";
  return "other";
}

function parseJson(content: string | undefined): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed: unknown = JSON.parse(content);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function dependencies(manifest: Record<string, unknown> | null, field: string): Array<{ name: string; version: string }> {
  const value = manifest?.[field];
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([name, version]) => ({ name, version }));
}

function lineAt(source: ts.SourceFile, offset: number): number {
  return source.getLineAndCharacterOfPosition(offset).line + 1;
}

function nodeHasJsx(node: ts.Node): boolean {
  const stack = [node];
  while (stack.length) {
    const item = stack.pop()!;
    if (ts.isJsxElement(item) || ts.isJsxSelfClosingElement(item) || ts.isJsxFragment(item)) return true;
    item.forEachChild((child) => { stack.push(child); });
  }
  return false;
}

function exported(node: ts.Node): boolean {
  return Boolean(ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword));
}

function parseJavaScript(file: AnalysisInputFile): ParsedFile | null {
  if (!file.content || !/\.(?:[cm]?[jt]sx?)$/i.test(file.path)) return null;
  const ext = extension(file.path);
  const kind = ext.endsWith("x") ? ts.ScriptKind.TSX :
    [".js", ".mjs", ".cjs"].includes(ext) ? ts.ScriptKind.JSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, kind);
  const imports = new Set<string>();
  const components: ParsedFile["components"] = [];
  const routeCalls: ParsedFile["routeCalls"] = [];
  const routeElements: string[] = [];
  const staticRoutePaths: string[] = [];
  const envNames = new Set<string>();
  let hasHandlers = false;
  let hasForms = false;
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.add(node.moduleSpecifier.text);
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.add(node.moduleSpecifier.text);
    if (ts.isCallExpression(node)) {
      const call = node.expression;
      if (ts.isIdentifier(call) && call.text === "require" && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.add(node.arguments[0].text);
      if (ts.isPropertyAccessExpression(call) && /^(get|post|put|patch|delete|all|options|head)$/.test(call.name.text) &&
        /(?:app|router|server)/i.test(call.expression.getText(source))) {
        const route = node.arguments[0];
        if (route && (ts.isStringLiteral(route) || ts.isNoSubstitutionTemplateLiteral(route))) {
          routeCalls.push({ method: call.name.text.toUpperCase(), route: route.text });
        }
      }
    }
    if (ts.isPropertyAccessExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(source) === "process" && node.expression.name.text === "env") {
      envNames.add(node.name.text);
    }
    if (ts.isElementAccessExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(source) === "process" && node.expression.name.text === "env" &&
      node.argumentExpression && ts.isStringLiteral(node.argumentExpression)) envNames.add(node.argumentExpression.text);
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(source).toLowerCase();
      if (["form", "input", "textarea", "select"].includes(tag)) hasForms = true;
      if (node.attributes.properties.some((attr) => ts.isJsxAttribute(attr) && /^on[A-Z]/.test(attr.name.getText(source)))) hasHandlers = true;
      if (tag === "route") {
        const prop = node.attributes.properties.find((attr) => ts.isJsxAttribute(attr) && attr.name.getText(source) === "path");
        if (prop && ts.isJsxAttribute(prop) && prop.initializer && ts.isStringLiteral(prop.initializer)) routeElements.push(prop.initializer.text);
      }
    }
    if (ts.isObjectLiteralExpression(node)) {
      const properties = node.properties.filter(ts.isPropertyAssignment);
      const pathProperty = properties.find((property) =>
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) && property.name.text === "path",
      );
      const hasRouteTarget = properties.some((property) =>
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
        ["component", "loadComponent", "loadChildren", "redirectTo", "children"].includes(property.name.text),
      );
      const pathValue = pathProperty?.initializer;
      if (hasRouteTarget && pathValue && (ts.isStringLiteral(pathValue) || ts.isNoSubstitutionTemplateLiteral(pathValue))) {
        staticRoutePaths.push(pathValue.text);
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name && nodeHasJsx(node)) components.push({ name: node.name.text.slice(0, 200), exported: exported(node) });
    if (ts.isClassDeclaration(node) && node.name && nodeHasJsx(node)) components.push({ name: node.name.text.slice(0, 200), exported: exported(node) });
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && nodeHasJsx(node.initializer)) {
      const statement = node.parent.parent;
      components.push({ name: node.name.text.slice(0, 200), exported: ts.isVariableStatement(statement) && exported(statement) });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { source, imports: [...imports], components, routeCalls, routeElements, staticRoutePaths, envNames, hasHandlers, hasForms };
}

function routeSegments(segments: string[]): string {
  return "/" + segments.filter((part) => !part.startsWith("@") && !/^\([^)]*\)$/.test(part))
    .map((part) => part.replace(/^\[\[\.\.\.(.+)\]\]$/, "*$1?").replace(/^\[\.\.\.(.+)\]$/, "*$1").replace(/^\[(.+)\]$/, ":$1"))
    .join("/");
}

function nextRoute(filePath: string, router: "app" | "pages"): { route: string; type: "page" | "api" | "layout" } | null {
  const marker = router === "app" ? "/app/" : "/pages/";
  const normalized = filePath.replace(/\\/g, "/");
  const position = normalized.indexOf(marker);
  if (position < 0) return null;
  const segments = normalized.slice(position + marker.length, -extension(filePath).length).split("/");
  const last = segments[segments.length - 1]?.toLowerCase();
  if (router === "app" && last === "layout") {
    segments.pop();
    return { route: routeSegments(segments), type: "layout" };
  }
  if (router === "app" && last !== "page" && last !== "route") return null;
  if (router === "pages" && ["_app", "_document", "_error"].includes(last)) return null;
  const isApi = router === "app" ? last === "route" : segments[0]?.toLowerCase() === "api";
  if (router === "app" || last === "index") segments.pop();
  return { route: routeSegments(segments), type: isApi ? "api" : "page" };
}

function roleFor(filePath: string, name: string): string {
  const value = (filePath + " " + name).toLowerCase();
  if (/dashboard|overview/.test(value)) return "dashboard";
  if (/navbar|navigation|sidebar|menu/.test(value)) return "navigation";
  if (/header/.test(value)) return "header";
  if (/modal|dialog|drawer/.test(value)) return "dialog";
  if (/form|login|signup|settings/.test(value)) return "form";
  if (/table|list|grid/.test(value)) return "data-list";
  if (/card/.test(value)) return "card";
  return "component";
}

function addFinding(findings: AnalysisFindingDraft[], finding: AnalysisFindingDraft): void {
  const key = [finding.category, finding.title, finding.fileReference, finding.lineStart].join("|");
  if (!findings.some((item) => [item.category, item.title, item.fileReference, item.lineStart].join("|") === key)) findings.push(finding);
}

function moduleExists(target: string, paths: Set<string>): boolean {
  return [target, target + ".ts", target + ".tsx", target + ".js", target + ".jsx", target + ".json",
    target + "/index.ts", target + "/index.tsx", target + "/index.js", target + "/index.jsx"].some((item) => paths.has(item));
}

function uiEntry(name: string, file: string, role: string, confidence: number, shared: boolean, routes: string[], hasHandlers: boolean, evidence: string[]): UiEntry {
  return { name, file, role, confidence, shared, relatedRoutes: routes, hasHandlers, evidence };
}

function parseRequirement(line: string): { name: string; version: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*(?:\[[^\]]+\])?\s*(?:(?:==|~=|>=|<=|!=|>|<)\s*([^\s,;]+))?/);
  return match ? { name: match[1], version: match[2] || "*" } : null;
}

function parsePyprojectDependencies(content: string): { direct: Array<{ name: string; version: string }>; development: Array<{ name: string; version: string }> } {
  const direct: Array<{ name: string; version: string }> = [];
  const development: Array<{ name: string; version: string }> = [];
  let section = "";
  let pending: { destination: "direct" | "development"; value: string } | null = null;
  const addRequirement = (destination: "direct" | "development", raw: string) => {
    const item = parseRequirement(raw);
    if (item) (destination === "direct" ? direct : development).push(item);
  };
  const addArray = (destination: "direct" | "development", value: string) => {
    for (const match of value.matchAll(/(?:"([^"]+)"|'([^']+)')/g)) addRequirement(destination, match[1] ?? match[2]);
  };

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      section = sectionMatch[1].toLowerCase();
      pending = null;
      continue;
    }
    if (pending) {
      pending.value += "\n" + trimmed;
      if (trimmed.includes("]")) {
        addArray(pending.destination, pending.value);
        pending = null;
      }
      continue;
    }

    let destination: "direct" | "development" | null = null;
    if (section === "project" && /^dependencies\s*=/.test(trimmed)) destination = "direct";
    else if (section === "project.optional-dependencies" && /^[A-Za-z0-9_.-]+\s*=/.test(trimmed)) destination = "direct";
    else if (section === "tool.poetry.dependencies") destination = "direct";
    else if (section === "tool.poetry.dev-dependencies" || /^tool\.poetry\.group\.[^.]+\.dependencies$/.test(section)) destination = "development";
    if (!destination) continue;

    const assignment = trimmed.match(/^(?:["']?)([A-Za-z0-9_.-]+)(?:["']?)\s*=\s*(.*)$/);
    if (!assignment) continue;
    const name = assignment[1];
    const value = assignment[2];
    if (destination === "direct" && section === "tool.poetry.dependencies" && name.toLowerCase() === "python") continue;
    if (section === "project" || section === "project.optional-dependencies") {
      if (!value.startsWith("[")) continue;
      if (value.includes("]")) addArray(destination, value);
      else pending = { destination, value };
      continue;
    }
    const version = value.match(/^(?:"([^"]+)"|'([^']+)'|\{\s*version\s*=\s*["']([^"']+)["'])/);
    const versionValue = version?.[1] ?? version?.[2] ?? version?.[3];
    if (versionValue) addRequirement(destination, name + "==" + versionValue);
  }
  return { direct, development };
}

function sanitizeOutput(value: string): string {
  return value
    .replace(/(https?:\/\/)[^/@\s]+@/gi, "$1[redacted]@")
    .replace(/((?:token|secret|password|api[_-]?key)\s*[:=]\s*)[^\s,;)}]+/gi, "$1[redacted]")
    .replace(/(--?(?:token|secret|password|api[-_]?key)\s+)[^\s]+/gi, "$1[redacted]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, 1000);
}

export async function analyzeProject(
  projectId: string,
  analysisVersion: number,
  files: AnalysisInputFile[],
  onProgress: AnalysisProgress,
  checkActive: () => Promise<void>,
): Promise<ProjectAnalysisResult> {
  const findings: AnalysisFindingDraft[] = [];
  const inventory: InventoryFile[] = [];
  const sourceFiles: AnalysisInputFile[] = [];
  const byPath = new Map(files.map((file) => [file.path, file]));
  const progress = async (stage: AnalysisStage, done: number, total: number) => onProgress(stage, done, total);

  await progress("inventory", 0, files.length);
  for (let index = 0; index < files.length; index += 1) {
    if (index % 25 === 0) await checkActive();
    const file = files[index];
    const ext = extension(file.path);
    const fileCategory = category(file.path);
    const parseStatus: InventoryFile["parseStatus"] = file.contentUnavailableReason === "size" || file.contentUnavailableReason === "limit" ||
      (file.content === undefined && file.size > MAX_SOURCE_FILE_BYTES && SOURCE_EXTENSIONS.has(ext))
      ? "skipped_size"
      : file.contentUnavailableReason === "binary"
        ? "skipped_binary"
        : file.content === undefined
          ? (SOURCE_EXTENSIONS.has(ext) ? "skipped_binary" : "unsupported")
      : Buffer.byteLength(file.content, "utf8") > MAX_SOURCE_FILE_BYTES ? "skipped_size" : "parsed";
    inventory.push({
      path: file.path, extension: ext, category: fileCategory, size: file.size,
      sha256: file.sha256, parseStatus,
    });
    if (file.content && parseStatus === "parsed") sourceFiles.push(file);
    if (index % 25 === 0 || index + 1 === files.length) await progress("inventory", index + 1, files.length);
  }

  await progress("framework_detection", 0, 1);
  const packageJsonFile = byPath.get("package.json");
  const packageJson = parseJson(packageJsonFile?.content);
  const directNpm = dependencies(packageJson, "dependencies");
  const devNpm = dependencies(packageJson, "devDependencies");
  const allNpm = new Map([...directNpm, ...devNpm].map((item) => [item.name, item.version]));
  const frameworkEvidence = new Map<string, string[]>();
  const addFramework = (name: string, proof: string) => {
    frameworkEvidence.set(name, [...new Set([...(frameworkEvidence.get(name) ?? []), proof])]);
  };
  const has = (name: string) => allNpm.has(name);
  if (has("next") || [...byPath.keys()].some((file) => /^next\.config\./i.test(basename(file)))) {
    addFramework("Next.js", has("next") ? "package.json declares next" : "Next.js configuration file");
  }
  if (has("react")) addFramework("React", "package.json declares react");
  if (has("react") && has("vite")) addFramework("React with Vite", "package.json declares react and vite");
  else if (has("vite")) addFramework("Vite", "package.json declares vite");
  if (has("vue") || byPath.has("vue.config.js")) addFramework("Vue", has("vue") ? "package.json declares vue" : "Vue configuration file");
  if (has("@angular/core") || byPath.has("angular.json")) addFramework("Angular", has("@angular/core") ? "package.json declares @angular/core" : "angular.json");
  if (has("express")) addFramework("Express", "package.json declares express");
  if (has("@nestjs/core")) addFramework("NestJS", "package.json declares @nestjs/core");

  const pythonFiles = files.filter((file) => ["requirements.txt", "pyproject.toml", "pipfile"].includes(basename(file.path)));
  const pythonManifests = pythonFiles.map((file) => (file.content ?? "").toLowerCase()).join("\n");
  if (/\bfastapi\b/.test(pythonManifests)) addFramework("FastAPI", "Python dependency manifest declares fastapi");
  if (/\bflask\b/.test(pythonManifests)) addFramework("Flask", "Python dependency manifest declares flask");
  if (/\bdjango\b/.test(pythonManifests)) addFramework("Django", "Python dependency manifest declares django");

  const composerJson = parseJson(byPath.get("composer.json")?.content);
  const composerRequired = dependencies(composerJson, "require");
  const composerDev = dependencies(composerJson, "require-dev");
  const composerDeps = new Map([...composerRequired, ...composerDev].map((item) => [item.name, item.version]));
  if (composerDeps.has("laravel/framework") || byPath.has("artisan")) {
    addFramework("Laravel", composerDeps.has("laravel/framework") ? "composer.json declares laravel/framework" : "Laravel artisan file");
  }
  if (!frameworkEvidence.size && files.some((file) => extension(file.path) === ".html")) {
    addFramework("Static HTML", "HTML documents found and no supported framework evidence");
  }
  const technologies = [...frameworkEvidence.entries()].map(([name, evidence]) => ({
    name,
    kind: "framework",
    confidence: evidence.some((item) => item.includes("declares")) ? 0.98 : 0.85,
    evidence,
  }));
  const primaryFramework = technologies.find((item) => item.name !== "React")?.name ?? technologies[0]?.name ?? null;
  await progress("framework_detection", 1, 1);

  await progress("dependency_analysis", 0, files.length);
  const direct: ProjectBlueprintData["dependencies"]["direct"] = directNpm.map((item) => ({
    ...item, source: "package.json", confidence: 1,
  }));
  const development: ProjectBlueprintData["dependencies"]["development"] = devNpm.map((item) => ({
    ...item, source: "package.json", confidence: 1,
  }));
  for (const file of pythonFiles) {
    if (basename(file.path) !== "requirements.txt" || !file.content) continue;
    for (const line of file.content.split(/\r?\n/)) {
      const item = parseRequirement(line);
      if (item) direct.push({ ...item, source: file.path, confidence: 0.9 });
    }
  }
  const pyproject = byPath.get("pyproject.toml")?.content;
  if (pyproject) {
    const parsed = parsePyprojectDependencies(pyproject);
    direct.push(...parsed.direct.map((item) => ({ ...item, source: "pyproject.toml", confidence: 0.88 })));
    development.push(...parsed.development.map((item) => ({ ...item, source: "pyproject.toml", confidence: 0.88 })));
  }
  for (const item of composerRequired) direct.push({ ...item, source: "composer.json", confidence: 1 });
  for (const item of composerDev) development.push({ ...item, source: "composer.json", confidence: 1 });
  const cargo = byPath.get("Cargo.toml")?.content;
  if (cargo) {
    let isDev = false;
    for (const line of cargo.split(/\r?\n/)) {
      const section = line.trim().toLowerCase();
      if (/^\[[^\]]+\]$/.test(section)) isDev = section.includes("dev-dependencies");
      const item = line.match(/^([A-Za-z0-9_-]+)\s*=\s*["']([^"']+)["']/);
      if (item) (isDev ? development : direct).push({ name: item[1], version: item[2], source: "Cargo.toml", confidence: 0.85 });
    }
  }
  const goMod = byPath.get("go.mod")?.content;
  if (goMod) {
    const block = goMod.match(/require\s*\(([\s\S]*?)\)/);
    const lines = block ? block[1].split(/\r?\n/) : goMod.split(/\r?\n/).filter((line) => /^\s*require\s+/.test(line));
    for (const line of lines) {
      const item = line.trim().replace(/^require\s+/, "").match(/^(\S+)\s+(\S+)/);
      if (item) direct.push({ name: item[1], version: item[2], source: "go.mod", confidence: 0.9 });
    }
  }
  const lockfile = LOCKFILES.find((name) => byPath.has(name)) ?? null;
  let packageManager = typeof packageJson?.packageManager === "string" ? packageJson.packageManager.split("@")[0] : null;
  if (!packageManager) {
    const managers: Array<[string, string]> = [
      ["pnpm-lock.yaml", "pnpm"], ["yarn.lock", "yarn"], ["package-lock.json", "npm"],
      ["bun.lock", "bun"], ["bun.lockb", "bun"], ["poetry.lock", "poetry"], ["Pipfile.lock", "pipenv"],
      ["composer.lock", "composer"], ["Cargo.lock", "cargo"], ["go.sum", "go modules"],
    ];
    packageManager = managers.find(([file]) => byPath.has(file))?.[1] ?? null;
  }
  const packageLock = parseJson(byPath.get("package-lock.json")?.content);
  const lockedNpmVersions = new Map<string, string>();
  const lockPackages = packageLock?.packages;
  if (lockPackages && typeof lockPackages === "object" && !Array.isArray(lockPackages)) {
    for (const [lockPath, packageInfo] of Object.entries(lockPackages as Record<string, unknown>)) {
      if (!lockPath.includes("node_modules/") || !packageInfo || typeof packageInfo !== "object" || Array.isArray(packageInfo)) continue;
      const name = lockPath.slice(lockPath.lastIndexOf("node_modules/") + "node_modules/".length);
      const version = (packageInfo as Record<string, unknown>).version;
      if (name && typeof version === "string") lockedNpmVersions.set(name, version);
    }
  }
  for (const item of [...direct, ...development]) {
    const resolved = lockedNpmVersions.get(item.name);
    if (resolved) {
      item.version = resolved;
      item.source = "package.json and package-lock.json";
    }
  }
  const scriptsValue = packageJson?.scripts;
  const scripts = scriptsValue && typeof scriptsValue === "object" && !Array.isArray(scriptsValue)
    ? Object.fromEntries(Object.entries(scriptsValue as Record<string, unknown>).filter((item): item is [string, string] => typeof item[1] === "string"))
    : {};
  const declaredRuntime: Record<string, string> = {};
  const engines = packageJson?.engines;
  if (engines && typeof engines === "object" && !Array.isArray(engines)) {
    for (const [name, value] of Object.entries(engines as Record<string, unknown>)) if (typeof value === "string") declaredRuntime[name] = value;
  }
  for (const fileName of [".nvmrc", ".node-version", ".python-version"]) {
    const runtime = byPath.get(fileName)?.content?.trim();
    if (runtime) declaredRuntime[fileName === ".python-version" ? "python" : "node"] = runtime.slice(0, 80);
  }
  const parsedFiles = new Map<string, ParsedFile>();
  const observedImports = new Set<string>();
  await progress("dependency_analysis", files.length, files.length);

  await progress("source_analysis", 0, sourceFiles.length);
  for (let index = 0; index < sourceFiles.length; index += 1) {
    if (index % 20 === 0) await checkActive();
    const file = sourceFiles[index];
    const parsed = parseJavaScript(file);
    if (parsed) {
      parsedFiles.set(file.path, parsed);
      for (const imported of parsed.imports.filter((value) => !value.startsWith("."))) {
        observedImports.add(imported.startsWith("@") ? imported.split("/").slice(0, 2).join("/") : imported.split("/")[0]);
      }
      const diagnostics = (parsed.source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
      if (diagnostics.length) {
        const diagnostic = diagnostics[0];
        const line = diagnostic.start === undefined ? 1 : lineAt(parsed.source, diagnostic.start);
        const entry = inventory.find((item) => item.path === file.path);
        if (entry) entry.parseStatus = "parse_error";
        addFinding(findings, {
          category: "quality", severity: "low", title: "Source file has a parse error",
          description: "The static parser found a syntax error and skipped some structure in this file.",
          fileReference: file.path, lineStart: line, lineEnd: line, evidenceType: "confirmed", confidence: 0.95,
          remediation: "Review the reported line and rerun analysis after correcting the syntax.",
        });
      }
    }
    if (index % 20 === 0 || index + 1 === sourceFiles.length) await progress("source_analysis", index + 1, sourceFiles.length);
  }
  const environmentVariables = new Set<string>();
  for (const parsed of parsedFiles.values()) for (const variable of parsed.envNames) environmentVariables.add(variable);
  for (const file of sourceFiles) {
    if (!file.content) continue;
    if (/\.py$/i.test(file.path)) for (const match of file.content.matchAll(/\bos\.getenv\(\s*["']([A-Za-z_][A-Za-z0-9_]*)["']/g)) environmentVariables.add(match[1]);
    if (/\.(?:php)$/i.test(file.path)) for (const match of file.content.matchAll(/\b(?:getenv|env)\(\s*["']([A-Za-z_][A-Za-z0-9_]*)["']/g)) environmentVariables.add(match[1]);
    if (/\.env(?:\.[^/]*)?$/i.test(file.path)) for (const line of file.content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) environmentVariables.add(match[1]);
    }
  }

  await progress("architecture_analysis", 0, files.length);
  const routes: RouteEntry[] = [];
  const layouts: string[] = [];
  const addRoute = (route: RouteEntry) => {
    const safeRoute = { ...route, path: sanitizeOutput(route.path) };
    if (!routes.some((item) => item.file === safeRoute.file && item.path === safeRoute.path && item.type === safeRoute.type)) routes.push(safeRoute);
  };
  for (const file of files) {
    const appRoute = nextRoute(file.path, "app");
    const pagesRoute = nextRoute(file.path, "pages");
    if (appRoute?.type === "layout") layouts.push(file.path);
    if (appRoute && appRoute.type !== "layout") addRoute({
      path: appRoute.route, framework: "Next.js App Router", file: file.path, type: appRoute.type,
      confidence: 0.98, dynamic: /\[[^/]+\]/.test(file.path),
    });
    if (pagesRoute) addRoute({
      path: pagesRoute.route, framework: "Next.js Pages Router", file: file.path, type: pagesRoute.type,
      confidence: 0.96, dynamic: /\[[^/]+\]/.test(file.path),
    });
    const parsed = parsedFiles.get(file.path);
    if (parsed) {
      for (const route of parsed.routeCalls) addRoute({
        path: route.route, framework: "Node.js route registration", file: file.path,
        type: route.method, confidence: 0.92, dynamic: false,
      });
      for (const route of parsed.routeElements) addRoute({
        path: route, framework: "React Router", file: file.path, type: "page",
        confidence: 0.8, dynamic: route.includes(":"),
      });
      const staticRouter = allNpm.has("vue-router") ? "Vue Router" : allNpm.has("@angular/router") ? "Angular Router" : null;
      if (staticRouter) for (const route of parsed.staticRoutePaths) addRoute({
        path: route || "/", framework: staticRouter, file: file.path, type: "page",
        confidence: 0.82, dynamic: route.includes(":") || route.includes("*"),
      });
    }
    if (!file.content || !/\.py$/i.test(file.path)) continue;
    const routePatterns = [
      /@(?:app|router)\.(?:get|post|put|patch|delete|api_route)\s*\(\s*["']([^"']+)["']/gi,
      /@(?:app|blueprint)\.route\s*\(\s*["']([^"']+)["']/gi,
      /\bpath\(\s*["']([^"']*)["']/gi,
    ];
    for (const pattern of routePatterns) for (const match of file.content.matchAll(pattern)) addRoute({
      path: match[1] || "/", framework: "Python web route", file: file.path,
      type: "api", confidence: 0.82, dynamic: false,
    });
  }
  for (const file of files.filter((item) => /\.php$/i.test(item.path) && item.content)) {
    const pattern = /\bRoute::(?:get|post|put|patch|delete|any|match)\s*\(\s*["']([^"']+)["']/gi;
    for (const match of file.content!.matchAll(pattern)) addRoute({
      path: match[1], framework: "Laravel", file: file.path, type: "api", confidence: 0.85, dynamic: false,
    });
  }
  const apiEndpoints = routes.filter((route) => route.type !== "page");
  const entryPoints = inventory.filter((item) =>
    /(^|\/)(?:main|index|server|app)\.(?:[cm]?[jt]sx?|py|php|go)$/i.test(item.path) ||
    /(^|\/)(manage\.py|artisan)$/.test(item.path),
  ).map((item) => item.path).slice(0, 100);
  const dataModels = inventory.filter((item) =>
    /(?:models?|schemas?|entities?|prisma\/schema\.prisma|\.model\.(?:ts|js))\b/i.test(item.path),
  ).map((item) => item.path).slice(0, 500);
  const authEvidence = new Set<string>();
  for (const name of allNpm.keys()) if (/(passport|jsonwebtoken|jose|bcrypt|argon2|next-auth|auth0|clerk|supabase|firebase-admin)/i.test(name)) {
    authEvidence.add("Dependency declared: " + name);
  }
  for (const file of sourceFiles) if (file.content && /(requireAuth|isAuthenticated|authenticate|authorization|authorize|jwt\.verify|passport\.authenticate)/i.test(file.content)) {
    authEvidence.add("Authentication or authorization reference in " + file.path);
  }
  const authenticationPatterns = authEvidence.size ? [{
    name: "Authentication or authorization indicators",
    evidence: [...authEvidence].slice(0, 20),
    confidence: authEvidence.size > 1 ? 0.82 : 0.65,
  }] : [];
  const externalIntegrations = [...new Set(direct.map((item) => item.name).filter((name) =>
    /^(axios|@prisma\/client|mongoose|mongodb|pg|mysql2|firebase|@supabase\/supabase-js|stripe|@aws-sdk\/|openai|@anthropic-ai\/)/.test(name),
  ))].slice(0, 100);
  await progress("architecture_analysis", files.length, files.length);

  await progress("ui_analysis", 0, sourceFiles.length);
  const pages: UiEntry[] = [];
  const components: UiEntry[] = [];
  const navigation: UiEntry[] = [];
  const forms: UiEntry[] = [];
  const routeFiles = new Map(routes.filter((route) => route.type === "page").map((route) => [route.file, route.path]));
  const pushUi = (items: UiEntry[], item: UiEntry) => {
    if (!items.some((existing) => existing.file === item.file && existing.name === item.name)) items.push(item);
  };
  for (let index = 0; index < sourceFiles.length; index += 1) {
    if (index % 20 === 0) await checkActive();
    const file = sourceFiles[index];
    const parsed = parsedFiles.get(file.path);
    const fileName = path.posix.basename(file.path, extension(file.path));
    const route = routeFiles.get(file.path);
    if (route !== undefined || (/\.(vue|html)$/i.test(file.path) && /(^|\/)(index|page)\.(vue|html)$/i.test(file.path))) {
      const role = roleFor(file.path, fileName);
      pushUi(pages, uiEntry(fileName, file.path, role === "component" ? "page" : role,
        route === undefined ? 0.68 : 0.96, false, route === undefined ? [] : [route],
        parsed?.hasHandlers ?? false, route === undefined ? ["Page-like file name"] : ["Framework route file"]));
    }
    if (parsed) {
      for (const component of parsed.components) {
        if (!component.exported && !/^[A-Z]/.test(component.name)) continue;
        const role = roleFor(file.path, component.name);
        const entry = uiEntry(component.name, file.path, role, component.exported ? 0.9 : 0.72,
          !routeFiles.has(file.path), routeFiles.has(file.path) ? [routeFiles.get(file.path)!] : [],
          parsed.hasHandlers, [component.exported ? "Exported JSX component" : "Named JSX component"]);
        pushUi(components, entry);
        if (["navigation", "header", "sidebar"].includes(role)) pushUi(navigation, entry);
        if (parsed.hasForms || role === "form") pushUi(forms, { ...entry, role: "form", evidence: [...entry.evidence, "Form or input pattern"] });
      }
    } else if (/\.(vue|html)$/i.test(file.path) && file.content && /<\s*(form|input|textarea|select)\b/i.test(file.content)) {
      pushUi(forms, uiEntry(fileName, file.path, "form", 0.72, !routeFiles.has(file.path), [], false, ["Form or input markup"]));
    }
    if (index % 20 === 0 || index + 1 === sourceFiles.length) await progress("ui_analysis", index + 1, sourceFiles.length);
  }
  const stylingSystems = new Set<string>();
  if (allNpm.has("tailwindcss")) stylingSystems.add("Tailwind CSS");
  if (allNpm.has("sass") || allNpm.has("node-sass")) stylingSystems.add("Sass");
  if (allNpm.has("styled-components")) stylingSystems.add("styled-components");
  if (allNpm.has("@emotion/react")) stylingSystems.add("Emotion");
  if ([...allNpm.keys()].some((name) => /^(@mui\/|@chakra-ui\/|antd$|@radix-ui\/)/.test(name))) stylingSystems.add("Component library");
  if (files.some((file) => [".css", ".scss", ".sass", ".less"].includes(extension(file.path)))) stylingSystems.add("CSS stylesheets");
  if (files.some((file) => /\.module\.(css|scss|sass)$/i.test(file.path))) stylingSystems.add("CSS Modules");
  const designTokens = inventory.filter((item) => /(?:tokens?|theme|variables?)\.(css|scss|sass|less|json|ts)$/i.test(item.path))
    .map((item) => item.path).slice(0, 100);
  const responsiveIndicators = sourceFiles.filter((file) => file.content && (/@media\b|(?:sm|md|lg|xl):|useMediaQuery|responsive/i.test(file.content)))
    .map((file) => file.path).slice(0, 200);

  await progress("quality_checks", 0, sourceFiles.length);
  const allPaths = new Set(files.map((file) => file.path));
  for (let index = 0; index < sourceFiles.length; index += 1) {
    if (index % 25 === 0) await checkActive();
    const file = sourceFiles[index];
    const content = file.content ?? "";
    const lines = content.split(/\r?\n/);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const secretPattern = /(?:api[_-]?key|secret|access[_-]?token|password|private[_-]?key)\s*[:=]\s*["']([^"']{8,})["']/i;
      const envPattern = /\.env(?:\.[^/]*)?$/i.test(file.path) &&
        /(?:api[_-]?key|secret|access[_-]?token|password|private[_-]?key)\s*=/i.test(line)
        ? /(?:^|=)\s*([^\s#]{12,})\s*$/
        : null;
      const match = line.match(secretPattern);
      const envMatch = envPattern ? line.match(envPattern) : null;
      const valueForCheck = match?.[1] ?? envMatch?.[1] ?? "";
      const placeholder = /(?:example|sample|placeholder|changeme|change-me|dummy|fake|replace|xxxxx|your[_-])/i.test(valueForCheck);
      if ((match || envMatch) && !placeholder) addFinding(findings, {
        category: "security", severity: "high", title: "Possible hard-coded secret",
        description: "A value assigned to a secret-like key was detected. Its contents are redacted from the report.",
        fileReference: file.path, lineStart: lineIndex + 1, lineEnd: lineIndex + 1,
        evidenceType: "inferred", confidence: 0.78,
        remediation: "Move credentials to a protected secret store and rotate any credential that may have been committed.",
      });
      if (/\beval\s*\(/.test(line) || /\bnew\s+Function\s*\(/.test(line)) addFinding(findings, {
        category: "security", severity: "medium", title: "Dynamic code evaluation pattern",
        description: "This line appears to evaluate a string as code; review the data source and execution context.",
        fileReference: file.path, lineStart: lineIndex + 1, lineEnd: lineIndex + 1,
        evidenceType: "confirmed", confidence: 0.9,
        remediation: "Avoid evaluating dynamic strings as code; use a constrained parser or explicit operation map.",
      });
      if (/\bdangerouslySetInnerHTML\b/.test(line)) addFinding(findings, {
        category: "security", severity: "medium", title: "Raw HTML rendering pattern",
        description: "This line renders HTML outside the framework's normal escaping; verify that the value is sanitized.",
        fileReference: file.path, lineStart: lineIndex + 1, lineEnd: lineIndex + 1,
        evidenceType: "confirmed", confidence: 0.92,
        remediation: "Sanitize untrusted HTML with a maintained sanitizer or render structured content instead.",
      });
    }
    const parsed = parsedFiles.get(file.path);
    if (parsed) for (const imported of parsed.imports.filter((item) => item.startsWith("."))) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), imported));
      if (target.startsWith("../") || !moduleExists(target, allPaths)) addFinding(findings, {
        category: "quality", severity: "low", title: "Relative import target was not found",
        description: "The analyzer could not match this relative import to an imported file. Aliases and generated modules may not be resolved.",
        fileReference: file.path, evidenceType: "inferred", confidence: 0.66,
        remediation: "Check the import path and project aliases; runtime-generated modules may be outside static analysis.",
      });
    }
    if (index % 25 === 0 || index + 1 === sourceFiles.length) await progress("quality_checks", index + 1, sourceFiles.length);
  }
  if (packageJsonFile && !packageJson) addFinding(findings, {
    category: "configuration", severity: "low", title: "Package manifest could not be parsed",
    description: "package.json is present but is not valid JSON, so dependency and script extraction is incomplete.",
    fileReference: packageJsonFile.path, evidenceType: "confirmed", confidence: 0.99,
    remediation: "Correct the JSON syntax and start a new analysis.",
  });
  if (!lockfile && direct.length > 0) addFinding(findings, {
    category: "configuration", severity: "info", title: "No supported lockfile found",
    description: "Dependency versions may resolve differently between installs because no supported lockfile was found.",
    evidenceType: "inferred", confidence: 0.7,
    remediation: "Commit the lockfile used by your package manager to make dependency resolution repeatable.",
  });
  await progress("quality_checks", sourceFiles.length, sourceFiles.length);

  await progress("blueprint_generation", 0, 1);
  const languageCounts = new Map<string, number>();
  for (const item of inventory) {
    const language = LANGUAGE_BY_EXTENSION[item.extension];
    if (language && item.category === "source") languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
  }
  const languages = [...languageCounts.entries()].sort((left, right) => right[1] - left[1]).map(([name]) => name);
  const count = (value: string) => inventory.filter((item) => item.category === value).length;
  const skippedCount = inventory.filter((item) => ["skipped_size", "unsupported", "parse_error"].includes(item.parseStatus)).length;
  const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
  const analysisStatus = inventory.some((item) => ["skipped_size", "parse_error"].includes(item.parseStatus)) ? "incomplete" : "completed";
  const advisoryNote = "Dependency advisory scan is unavailable because no advisory database is configured; no package is marked safe.";
  const aiNote = "AI analysis is not configured; this report contains deterministic static findings only.";
  const summaryDescription = count("source")
    ? "Static analysis inventoried " + count("source") + " source files across " + (languages.join(", ") || "unclassified languages") +
      "; " + (primaryFramework ? "it detected " + primaryFramework + " from repository evidence." : "no supported framework was confirmed.")
    : "The imported project contains no supported source files for structural analysis.";
  const sanitizedScripts = Object.fromEntries(Object.entries(scripts).map(([name, value]) => [sanitizeOutput(name), sanitizeOutput(value)]));
  const sanitizedDependencies = (items: typeof direct) => items.map((item) => ({
    name: sanitizeOutput(item.name),
    version: sanitizeOutput(item.version),
    source: sanitizeOutput(item.source),
    confidence: item.confidence,
  }));
  const result: ProjectBlueprintData = {
    schemaVersion: 1,
    projectId,
    analysisVersion,
    summary: { description: summaryDescription, primaryFramework, languages },
    inventory: {
      fileCount: inventory.length, sourceFileCount: count("source"), assetCount: count("asset"),
      configurationFileCount: count("configuration"), documentationFileCount: count("documentation"),
      testFileCount: count("test"), skippedFileCount: skippedCount, totalSizeBytes,
    },
    technologies,
    architecture: {
      entryPoints,
      routes,
      layouts: [...new Set(layouts)],
      apiEndpoints,
      dataModels,
      authenticationPatterns,
      environmentVariables: [...environmentVariables].sort().slice(0, 500),
      externalIntegrations,
    },
    uiInventory: {
      pages, components, navigation, forms, designTokens,
      stylingSystems: [...stylingSystems],
      responsiveIndicators,
    },
    dependencies: {
      packageManager,
      direct: sanitizedDependencies(direct),
      development: sanitizedDependencies(development),
      observedImports: [...observedImports].map(sanitizeOutput).sort().slice(0, 1000),
      lockfile,
      scripts: sanitizedScripts,
      declaredRuntime,
      advisoryCoverage: "not_configured",
    },
    quality: {
      findingsCount: findings.length,
      checksCompleted: [
        "Private manifest inventory", "Framework evidence", "Dependency and script manifests",
        "JavaScript and TypeScript syntax and imports", "Static secret and risky-code patterns",
      ],
      checksSkipped: [advisoryNote, aiNote, "Project scripts and application code are not executed."],
      limitations: [
        "Static evidence cannot prove runtime behavior, complete route coverage, or security.",
        "Python, PHP, Go and other language structure uses conservative text extraction.",
        "No dependency installation, external advisory lookup, or uploaded application execution is performed.",
      ],
    },
    metadata: { generatedAt: new Date().toISOString(), status: analysisStatus, aiStatus: "unavailable" },
  };
  result.quality.findingsCount = findings.length;
  await progress("blueprint_generation", 1, 1);
  return { blueprint: result, findings, inventoryFiles: inventory };
}

export function validateBlueprintShape(value: unknown): value is ProjectBlueprintData {
  const record = (item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item));
  const keysAre = (item: unknown, keys: string[]): item is Record<string, unknown> => record(item) &&
    Object.keys(item).sort().join("|") === [...keys].sort().join("|");
  const strings = (items: unknown, max = 10000) => Array.isArray(items) && items.length <= max &&
    items.every((item) => typeof item === "string" && item.length <= 1024);
  const number = (item: unknown, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(item) && Number(item) >= 0 && Number(item) <= max;
  const score = (item: unknown) => typeof item === "number" && Number.isFinite(item) && item >= 0 && item <= 1;
  const route = (item: unknown) => keysAre(item, ["path", "framework", "file", "type", "confidence", "dynamic"]) &&
    typeof item.path === "string" && item.path.length <= 1024 && typeof item.framework === "string" &&
    typeof item.file === "string" && typeof item.type === "string" && score(item.confidence) && typeof item.dynamic === "boolean";
  const uiItem = (item: unknown) => keysAre(item, ["name", "file", "role", "confidence", "shared", "relatedRoutes", "hasHandlers", "evidence"]) &&
    typeof item.name === "string" && item.name.length <= 200 && typeof item.file === "string" &&
    typeof item.role === "string" && score(item.confidence) && typeof item.shared === "boolean" &&
    strings(item.relatedRoutes, 500) && typeof item.hasHandlers === "boolean" && strings(item.evidence, 50);
  const dependency = (item: unknown) => keysAre(item, ["name", "version", "source", "confidence"]) &&
    typeof item.name === "string" && item.name.length <= 1000 && typeof item.version === "string" &&
    item.version.length <= 1000 && typeof item.source === "string" && item.source.length <= 1000 && score(item.confidence);
  if (!keysAre(value, ["schemaVersion", "projectId", "analysisVersion", "summary", "inventory", "technologies", "architecture", "uiInventory", "dependencies", "quality", "metadata"])) return false;
  const blueprint = value as unknown as ProjectBlueprintData;
  if (blueprint.schemaVersion !== 1 || !/^[a-f0-9]{24}$/i.test(blueprint.projectId) || !number(blueprint.analysisVersion, 1000000) || blueprint.analysisVersion < 1) return false;
  if (!keysAre(blueprint.summary, ["description", "primaryFramework", "languages"]) ||
    typeof blueprint.summary.description !== "string" || blueprint.summary.description.length > 2000 ||
    !(blueprint.summary.primaryFramework === null || typeof blueprint.summary.primaryFramework === "string") ||
    !strings(blueprint.summary.languages, 100)) return false;
  if (!keysAre(blueprint.inventory, ["fileCount", "sourceFileCount", "assetCount", "configurationFileCount", "documentationFileCount", "testFileCount", "skippedFileCount", "totalSizeBytes"]) ||
    !number(blueprint.inventory.fileCount, 5000) || !number(blueprint.inventory.sourceFileCount, 5000) ||
    !number(blueprint.inventory.assetCount, 5000) || !number(blueprint.inventory.configurationFileCount, 5000) ||
    !number(blueprint.inventory.documentationFileCount, 5000) || !number(blueprint.inventory.testFileCount, 5000) ||
    !number(blueprint.inventory.skippedFileCount, 5000) ||
    !number(blueprint.inventory.totalSizeBytes, 200 * 1024 * 1024)) return false;
  if (!Array.isArray(blueprint.technologies) || blueprint.technologies.length > 200 ||
    !blueprint.technologies.every((item) => keysAre(item, ["name", "kind", "confidence", "evidence"]) &&
      typeof item.name === "string" && typeof item.kind === "string" && score(item.confidence) && strings(item.evidence, 50))) return false;
  const architecture = blueprint.architecture;
  if (!keysAre(architecture, ["entryPoints", "routes", "layouts", "apiEndpoints", "dataModels", "authenticationPatterns", "environmentVariables", "externalIntegrations"]) ||
    !strings(architecture.entryPoints, 100) || !Array.isArray(architecture.routes) || architecture.routes.length > 10000 ||
    !architecture.routes.every(route) || !strings(architecture.layouts, 1000) || !Array.isArray(architecture.apiEndpoints) ||
    architecture.apiEndpoints.length > 10000 || !architecture.apiEndpoints.every(route) || !strings(architecture.dataModels, 500) ||
    !strings(architecture.environmentVariables, 500) || !strings(architecture.externalIntegrations, 100)) return false;
  if (!Array.isArray(architecture.authenticationPatterns) || architecture.authenticationPatterns.length > 100 ||
    !architecture.authenticationPatterns.every((item) => keysAre(item, ["name", "evidence", "confidence"]) &&
      typeof item.name === "string" && strings(item.evidence, 50) && score(item.confidence))) return false;
  const ui = blueprint.uiInventory;
  if (!keysAre(ui, ["pages", "components", "navigation", "forms", "designTokens", "stylingSystems", "responsiveIndicators"]) ||
    !Array.isArray(ui.pages) || ui.pages.length > 5000 || !ui.pages.every(uiItem) ||
    !Array.isArray(ui.components) || ui.components.length > 5000 || !ui.components.every(uiItem) ||
    !Array.isArray(ui.navigation) || ui.navigation.length > 5000 || !ui.navigation.every(uiItem) ||
    !Array.isArray(ui.forms) || ui.forms.length > 5000 || !ui.forms.every(uiItem) ||
    !strings(ui.designTokens, 100) || !strings(ui.stylingSystems, 100) || !strings(ui.responsiveIndicators, 200)) return false;
  const deps = blueprint.dependencies;
  if (!keysAre(deps, ["packageManager", "direct", "development", "observedImports", "lockfile", "scripts", "declaredRuntime", "advisoryCoverage"]) ||
    !(deps.packageManager === null || typeof deps.packageManager === "string") ||
    !Array.isArray(deps.direct) || deps.direct.length > 10000 || !deps.direct.every(dependency) ||
    !Array.isArray(deps.development) || deps.development.length > 10000 || !deps.development.every(dependency) ||
    !strings(deps.observedImports, 1000) || !(deps.lockfile === null || typeof deps.lockfile === "string") ||
    !record(deps.scripts) || Object.entries(deps.scripts).some(([key, val]) => key.length > 200 || typeof val !== "string" || val.length > 1000) ||
    !record(deps.declaredRuntime) || Object.entries(deps.declaredRuntime).some(([key, val]) => key.length > 200 || typeof val !== "string" || val.length > 1000) ||
    !["not_configured", "partial"].includes(deps.advisoryCoverage)) return false;
  const quality = blueprint.quality;
  if (!keysAre(quality, ["findingsCount", "checksCompleted", "checksSkipped", "limitations"]) ||
    !number(quality.findingsCount, 100000) || !strings(quality.checksCompleted, 100) ||
    !strings(quality.checksSkipped, 100) || !strings(quality.limitations, 100)) return false;
  const metadata = blueprint.metadata;
  return keysAre(metadata, ["generatedAt", "status", "aiStatus"]) &&
    typeof metadata.generatedAt === "string" && !Number.isNaN(Date.parse(metadata.generatedAt)) &&
    ["completed", "incomplete"].includes(metadata.status) && metadata.aiStatus === "unavailable";
}

export function validateAnalysisInventoryFile(value: unknown): value is AnalysisInventoryFile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const file = value as Partial<AnalysisInventoryFile>;
  return typeof file.path === "string" && file.path.length > 0 && file.path.length <= 1024 &&
    !file.path.startsWith("/") && !file.path.includes("\\") &&
    !file.path.split("/").some((segment) => segment === "." || segment === ".." || segment.includes(":")) &&
    typeof file.extension === "string" && file.extension.length <= 64 &&
    ["source", "configuration", "test", "documentation", "asset", "other"].includes(file.category ?? "") &&
    Number.isSafeInteger(file.size) && (file.size ?? -1) >= 0 &&
    typeof file.sha256 === "string" && /^[a-f0-9]{64}$/i.test(file.sha256) &&
    ["parsed", "skipped_binary", "skipped_size", "unsupported", "parse_error"].includes(file.parseStatus ?? "");
}
