import crypto from "crypto";
import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import * as unzipper from "unzipper";

const MB = 1024 * 1024;
const positiveInteger = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
};

export const PROJECT_IMPORT_LIMITS = Object.freeze({
  archiveBytes: positiveInteger("PROJECT_MAX_UPLOAD_MB", 100) * MB,
  totalBytes: positiveInteger("PROJECT_MAX_EXTRACTED_MB", 200) * MB,
  fileCount: positiveInteger("PROJECT_MAX_FILES", 5000),
  entryCount: positiveInteger("PROJECT_MAX_ENTRIES", 10000),
  pathDepth: positiveInteger("PROJECT_MAX_PATH_DEPTH", 20),
  compressionRatio: positiveInteger("PROJECT_MAX_COMPRESSION_RATIO", 100),
});

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_value, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function updateCrc32(crc: number, chunk: Buffer): number {
  let value = crc;
  for (const byte of chunk) value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return value;
}

const DEFAULT_EXCLUDED = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cache",
  "coverage",
];

export class ProjectImportError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "ProjectImportError";
  }
}

export interface ImportManifestFile {
  relativePath: string;
  storageKey: string;
  size: number;
  mimeType: string;
  sha256: string;
}

export interface ProjectFileInput {
  relativePath: string;
  kind: "file" | "directory";
}

export function normalizeProjectPath(input: string): string {
  if (!input || input.includes("\0") || input.length > 1024) {
    throw new ProjectImportError("INVALID_PATH", "A project file path is invalid.");
  }
  const slashPath = input.replace(/\\/g, "/");
  if (slashPath.startsWith("/") || /^[a-zA-Z]:/.test(slashPath)) {
    throw new ProjectImportError("INVALID_PATH", "Absolute paths are not allowed.");
  }

  const normalized = slashPath.endsWith("/")
    ? slashPath.slice(0, -1)
    : slashPath;
  const segments = normalized.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes(":") ||
        segment.length > 255,
    )
  ) {
    throw new ProjectImportError("INVALID_PATH", "A project file path is unsafe.");
  }
  if (segments.length > PROJECT_IMPORT_LIMITS.pathDepth) {
    throw new ProjectImportError("PATH_TOO_DEEP", "A project file is nested too deeply.");
  }
  return segments.join("/").normalize("NFC");
}

export function isExcludedProjectPath(relativePath: string): boolean {
  const configured = process.env.PROJECT_EXCLUDED_DIRS
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const excluded = new Set(
    [...DEFAULT_EXCLUDED, ...(configured ?? [])].map((item) =>
      item.toLocaleLowerCase("en-US"),
    ),
  );
  return relativePath
    .split("/")
    .some((segment) => excluded.has(segment.toLocaleLowerCase("en-US")));
}

export function validateProjectPaths(
  input: ProjectFileInput[],
): ProjectFileInput[] {
  if (input.length > PROJECT_IMPORT_LIMITS.entryCount) {
    throw new ProjectImportError("TOO_MANY_ENTRIES", "The project contains too many entries.");
  }

  const nodes = new Map<string, { path: string; kind: "file" | "directory" }>();
  const accepted: ProjectFileInput[] = [];
  for (const item of input) {
    const relativePath = normalizeProjectPath(item.relativePath);
    if (isExcludedProjectPath(relativePath)) continue;

    const segments = relativePath.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      registerNode(nodes, segments.slice(0, index).join("/"), "directory", true);
    }
    const firstRegistration = registerNode(
      nodes,
      relativePath,
      item.kind,
      item.kind === "directory",
    );
    if (firstRegistration) accepted.push({ ...item, relativePath });
  }

  if (accepted.filter((item) => item.kind === "file").length > PROJECT_IMPORT_LIMITS.fileCount) {
    throw new ProjectImportError("TOO_MANY_FILES", "The project contains too many files.");
  }
  return accepted;
}

function registerNode(
  nodes: Map<string, { path: string; kind: "file" | "directory" }>,
  relativePath: string,
  kind: "file" | "directory",
  allowDirectoryRepeat: boolean,
): boolean {
  const foldedPath = relativePath.toLocaleLowerCase("en-US");
  const existing = nodes.get(foldedPath);
  if (!existing) {
    nodes.set(foldedPath, { path: relativePath, kind });
    return true;
  }
  if (existing.path !== relativePath) {
    throw new ProjectImportError(
      "PATH_CASE_COLLISION",
      "The project contains paths that differ only by letter case.",
    );
  }
  if (existing.kind !== kind) {
    throw new ProjectImportError("PATH_COLLISION", "A file conflicts with another file or folder.");
  }
  if (kind === "directory" && allowDirectoryRepeat) return false;
  throw new ProjectImportError("DUPLICATE_PATH", "The project contains a duplicate file path.");
}

function validateArchiveEntry(entry: unzipper.File): void {
  if (entry.flags & 0x1) {
    throw new ProjectImportError(
      "ENCRYPTED_ARCHIVE",
      "Password-protected ZIP archives are not supported.",
    );
  }
  if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
    throw new ProjectImportError(
      "UNSUPPORTED_COMPRESSION",
      "The ZIP archive uses an unsupported compression method.",
    );
  }
  if (entry.externalFileAttributes & 0x400) {
    throw new ProjectImportError(
      "UNSUPPORTED_ENTRY_TYPE",
      "The ZIP archive contains a link or special file.",
    );
  }

  if ((entry.versionMadeBy >>> 8) === 3) {
    const unixType = (entry.externalFileAttributes >>> 16) & 0o170000;
    if (unixType && unixType !== 0o100000 && unixType !== 0o040000) {
      throw new ProjectImportError(
        "UNSUPPORTED_ENTRY_TYPE",
        "The ZIP archive contains a link or special file.",
      );
    }
  }
}

function mimeTypeFor(relativePath: string): string {
  const extension = path.extname(relativePath).toLowerCase();
  const types: Record<string, string> = {
    ".css": "text/css",
    ".csv": "text/csv",
    ".gif": "image/gif",
    ".html": "text/html",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    ".json": "application/json",
    ".md": "text/markdown",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ts": "text/typescript",
    ".tsx": "text/typescript",
    ".txt": "text/plain",
    ".webp": "image/webp",
    ".xml": "application/xml",
    ".yaml": "application/yaml",
    ".yml": "application/yaml",
  };
  return types[extension] ?? "application/octet-stream";
}

async function writeFileStream(
  source: NodeJS.ReadableStream,
  relativePath: string,
  snapshotDirectory: string,
  storagePrefix: string,
  expectedSize: number | undefined,
  expectedCrc32: number | undefined,
  bytesBefore: number,
): Promise<{ manifest: ImportManifestFile; bytesAfter: number }> {
  const target = path.join(snapshotDirectory, ...relativePath.split("/"));
  const root = path.resolve(snapshotDirectory) + path.sep;
  if (!path.resolve(target).startsWith(root)) {
    throw new ProjectImportError("INVALID_PATH", "A project file path is unsafe.");
  }
  await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });

  const hash = crypto.createHash("sha256");
  let crc32 = 0xffffffff;
  let size = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      if (size + bytesBefore > PROJECT_IMPORT_LIMITS.totalBytes) {
        callback(
          new ProjectImportError(
            "EXTRACTED_SIZE_LIMIT",
            "The project exceeds the configured expanded size limit.",
          ),
        );
        return;
      }
      hash.update(chunk);
      crc32 = updateCrc32(crc32, chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(source, limiter, createWriteStream(target, { flags: "wx", mode: 0o600 }));
  } catch (error) {
    await fs.rm(target, { force: true }).catch(() => undefined);
    throw error;
  }
  if (expectedSize !== undefined && size !== expectedSize) {
    await fs.rm(target, { force: true }).catch(() => undefined);
    throw new ProjectImportError("INVALID_ARCHIVE", "The ZIP archive is malformed.");
  }
  if (expectedCrc32 !== undefined && ((crc32 ^ 0xffffffff) >>> 0) !== expectedCrc32) {
    await fs.rm(target, { force: true }).catch(() => undefined);
    throw new ProjectImportError("INVALID_ARCHIVE", "The ZIP archive failed its file integrity check.");
  }

  return {
    manifest: {
      relativePath,
      storageKey: `${storagePrefix}/${relativePath}`,
      size,
      mimeType: mimeTypeFor(relativePath),
      sha256: hash.digest("hex"),
    },
    bytesAfter: bytesBefore + size,
  };
}

export async function extractProjectZip(
  archivePath: string,
  snapshotDirectory: string,
  storagePrefix: string,
): Promise<ImportManifestFile[]> {
  const archiveStats = await fs.stat(archivePath);
  if (!archiveStats.size) {
    throw new ProjectImportError("EMPTY_ARCHIVE", "The ZIP archive is empty.");
  }
  if (archiveStats.size > PROJECT_IMPORT_LIMITS.archiveBytes) {
    throw new ProjectImportError("ARCHIVE_SIZE_LIMIT", "The ZIP archive is too large.");
  }

  let archive: unzipper.CentralDirectory;
  try {
    archive = await unzipper.Open.file(archivePath);
  } catch {
    throw new ProjectImportError("INVALID_ARCHIVE", "The file is not a valid ZIP archive.");
  }
  if (!archive.files.length || archive.files.length > PROJECT_IMPORT_LIMITS.entryCount) {
    throw new ProjectImportError("TOO_MANY_ENTRIES", "The ZIP archive has an invalid number of entries.");
  }

  const archiveFiles: Array<{ entry: unzipper.File; relativePath: string }> = [];
  const rawPaths: ProjectFileInput[] = [];
  let declaredSize = 0;
  let compressedSize = 0;
  for (const entry of archive.files) {
    validateArchiveEntry(entry);
    const relativePath = normalizeProjectPath(entry.path);
    const isDirectory = entry.type === "Directory" || entry.path.endsWith("/");
    rawPaths.push({ relativePath, kind: isDirectory ? "directory" : "file" });
    if (isDirectory || isExcludedProjectPath(relativePath)) continue;

    const uncompressed = entry.uncompressedSize;
    const compressed = entry.compressedSize;
    if (
      !Number.isSafeInteger(uncompressed) ||
      !Number.isSafeInteger(compressed) ||
      uncompressed < 0 ||
      compressed < 0
    ) {
      throw new ProjectImportError("INVALID_ARCHIVE", "The ZIP archive is malformed.");
    }
    if (
      uncompressed > 0 &&
      (compressed === 0 || uncompressed / compressed > PROJECT_IMPORT_LIMITS.compressionRatio)
    ) {
      throw new ProjectImportError(
        "COMPRESSION_RATIO_LIMIT",
        "A ZIP entry expands beyond the allowed compression ratio.",
      );
    }
    declaredSize += uncompressed;
    compressedSize += compressed;
    if (declaredSize > PROJECT_IMPORT_LIMITS.totalBytes) {
      throw new ProjectImportError("EXTRACTED_SIZE_LIMIT", "The expanded project is too large.");
    }
    archiveFiles.push({ entry, relativePath });
  }
  if (
    declaredSize > 0 &&
    (compressedSize === 0 || declaredSize / compressedSize > PROJECT_IMPORT_LIMITS.compressionRatio)
  ) {
    throw new ProjectImportError(
      "COMPRESSION_RATIO_LIMIT",
      "The ZIP archive expands beyond the allowed compression ratio.",
    );
  }

  const accepted = validateProjectPaths(rawPaths);
  const acceptedFiles = new Set(
    accepted.filter((item) => item.kind === "file").map((item) => item.relativePath),
  );
  const candidates = archiveFiles.filter((item) => acceptedFiles.has(item.relativePath));
  if (!candidates.length) {
    throw new ProjectImportError("EMPTY_PROJECT", "The ZIP contains no importable project files.");
  }

  await fs.mkdir(snapshotDirectory, { recursive: true, mode: 0o700 });
  const manifest: ImportManifestFile[] = [];
  let totalBytes = 0;
  for (const candidate of candidates) {
    const written = await writeFileStream(
      candidate.entry.stream(),
      candidate.relativePath,
      snapshotDirectory,
      storagePrefix,
      candidate.entry.uncompressedSize,
      candidate.entry.crc32,
      totalBytes,
    );
    totalBytes = written.bytesAfter;
    manifest.push(written.manifest);
  }
  return manifest;
}

export async function storeFolderFiles(
  stagedFiles: Array<{ path: string; relativePath: string; size: number }>,
  snapshotDirectory: string,
  storagePrefix: string,
): Promise<ImportManifestFile[]> {
  let uploadBytes = 0;
  for (const file of stagedFiles) {
    uploadBytes += file.size;
    if (uploadBytes > PROJECT_IMPORT_LIMITS.totalBytes) {
      throw new ProjectImportError("EXTRACTED_SIZE_LIMIT", "The selected folder is too large.");
    }
  }

  const accepted = validateProjectPaths(
    stagedFiles.map((file) => ({ relativePath: file.relativePath, kind: "file" as const })),
  );
  const normalizedFiles = new Map<string, (typeof stagedFiles)[number]>();
  for (const file of stagedFiles) {
    normalizedFiles.set(normalizeProjectPath(file.relativePath), file);
  }

  if (!accepted.length) {
    throw new ProjectImportError("EMPTY_PROJECT", "The folder contains no importable files.");
  }
  await fs.mkdir(snapshotDirectory, { recursive: true, mode: 0o700 });

  const manifest: ImportManifestFile[] = [];
  let totalBytes = 0;
  for (const item of accepted) {
    const staged = normalizedFiles.get(item.relativePath);
    if (!staged) {
      throw new ProjectImportError("INVALID_FOLDER_MANIFEST", "The folder upload is incomplete.");
    }
    const written = await writeFileStream(
      createReadStream(staged.path),
      item.relativePath,
      snapshotDirectory,
      storagePrefix,
      staged.size,
      undefined,
      totalBytes,
    );
    totalBytes = written.bytesAfter;
    manifest.push(written.manifest);
  }
  return manifest;
}

export function detectWorkspaceMetadata(filePaths: string[]): {
  framework?: string;
  language?: string;
} {
  const names = new Set(filePaths.map((item) => path.posix.basename(item).toLowerCase()));
  const extensions = new Set(filePaths.map((item) => path.posix.extname(item).toLowerCase()));
  let framework: string | undefined;
  if (["next.config.js", "next.config.mjs", "next.config.ts"].some((name) => names.has(name))) {
    framework = "Next.js";
  } else if (["vite.config.js", "vite.config.ts"].some((name) => names.has(name))) {
    framework = "Vite";
  } else if (names.has("angular.json")) {
    framework = "Angular";
  } else if (["nuxt.config.js", "nuxt.config.ts"].some((name) => names.has(name))) {
    framework = "Nuxt";
  }

  let language: string | undefined;
  if (extensions.has(".ts") || extensions.has(".tsx")) language = "TypeScript";
  else if (extensions.has(".js") || extensions.has(".jsx")) language = "JavaScript";
  else if (extensions.has(".py")) language = "Python";
  else if (extensions.has(".go")) language = "Go";
  else if (extensions.has(".rs")) language = "Rust";
  return { framework, language };
}
