import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import {
  extractProjectZip,
  isExcludedProjectPath,
  normalizeProjectPath,
  ProjectImportError,
  validateProjectPaths,
} from "./project-import";

interface ZipEntryFixture {
  name: string;
  data: Buffer;
  method?: 0 | 8;
  unixMode?: number;
}

const crcTable = Uint32Array.from({ length: 256 }, (_value, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipFixture(entries: ZipEntryFixture[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const filename = Buffer.from(entry.name);
    const data = entry.data;
    const method = entry.method ?? 0;
    const compressed = method === 8 ? deflateRawSync(data) : data;
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(filename.length, 26);
    localParts.push(local, filename, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(entry.unixMode === undefined ? 20 : (3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(entry.unixMode === undefined ? 0 : (entry.unixMode << 16) >>> 0, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, filename);
    localOffset += local.length + filename.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

async function withTempDirectory<T>(run: (directory: string) => Promise<T>): Promise<T> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "duspace-project-import-"));
  try {
    return await run(directory);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

test("normalizeProjectPath accepts relative paths and normalizes Windows separators", () => {
  assert.equal(normalizeProjectPath("src\\components\\Button.tsx"), "src/components/Button.tsx");
  assert.equal(normalizeProjectPath(".github/workflows/ci.yml"), ".github/workflows/ci.yml");
});

test("normalizeProjectPath rejects absolute, traversal, null-byte and drive paths", () => {
  for (const value of ["/etc/passwd", "../secrets.env", "src/../../secret", "C:\\project\\file.ts", "src/\0file.ts"]) {
    assert.throws(() => normalizeProjectPath(value), ProjectImportError);
  }
});

test("generated dependencies are excluded while hidden source and configuration files remain", () => {
  assert.equal(isExcludedProjectPath("src/node_modules/library/file.js"), true);
  assert.equal(isExcludedProjectPath(".next/cache/output"), true);
  assert.equal(isExcludedProjectPath(".env.example"), false);
  assert.equal(isExcludedProjectPath(".github/workflows/ci.yml"), false);
  assert.equal(isExcludedProjectPath("src/assets/logo.svg"), false);
});

test("project path validation rejects duplicate, case-colliding and file-directory paths", () => {
  assert.throws(() => validateProjectPaths([
    { relativePath: "README.md", kind: "file" },
    { relativePath: "README.md", kind: "file" },
  ]), (error: unknown) => error instanceof ProjectImportError && error.code === "DUPLICATE_PATH");

  assert.throws(() => validateProjectPaths([
    { relativePath: "Readme.md", kind: "file" },
    { relativePath: "README.md", kind: "file" },
  ]), (error: unknown) => error instanceof ProjectImportError && error.code === "PATH_CASE_COLLISION");

  assert.throws(() => validateProjectPaths([
    { relativePath: "src", kind: "file" },
    { relativePath: "src/index.ts", kind: "file" },
  ]), (error: unknown) => error instanceof ProjectImportError && error.code === "PATH_COLLISION");
});

test("ZIP import extracts source files into its snapshot and records verified hashes", async () => {
  await withTempDirectory(async (directory) => {
    const archivePath = path.join(directory, "source.zip");
    const snapshotPath = path.join(directory, "snapshot");
    const source = Buffer.from("export const value = 42;\n");
    await fs.writeFile(archivePath, zipFixture([{ name: "src/index.ts", data: source }]));

    const manifest = await extractProjectZip(archivePath, snapshotPath, "owner/project/original/snapshot");
    assert.equal(manifest.length, 1);
    assert.equal(manifest[0].relativePath, "src/index.ts");
    assert.equal(manifest[0].sha256, crypto.createHash("sha256").update(source).digest("hex"));
    assert.equal(await fs.readFile(path.join(snapshotPath, "src/index.ts"), "utf8"), source.toString("utf8"));
  });
});

test("ZIP import rejects traversal and symlink entries before extraction", async () => {
  await withTempDirectory(async (directory) => {
    const archivePath = path.join(directory, "unsafe.zip");
    await fs.writeFile(archivePath, zipFixture([{ name: "../escape.txt", data: Buffer.from("no") }]));
    await assert.rejects(extractProjectZip(archivePath, path.join(directory, "snapshot"), "prefix"), ProjectImportError);
    assert.equal(await fs.access(path.join(directory, "escape.txt")).then(() => true, () => false), false);
  });

  await withTempDirectory(async (directory) => {
    const archivePath = path.join(directory, "link.zip");
    await fs.writeFile(archivePath, zipFixture([{ name: "linked-file", data: Buffer.from("target"), unixMode: 0o120777 }]));
    await assert.rejects(extractProjectZip(archivePath, path.join(directory, "snapshot"), "prefix"), (error: unknown) => error instanceof ProjectImportError && error.code === "UNSUPPORTED_ENTRY_TYPE");
  });
});

test("ZIP import enforces extraction-ratio limits", async () => {
  await withTempDirectory(async (directory) => {
    const archivePath = path.join(directory, "compressed.zip");
    await fs.writeFile(archivePath, zipFixture([{ name: "large.txt", data: Buffer.alloc(20_000, 65), method: 8 }]));
    await assert.rejects(extractProjectZip(archivePath, path.join(directory, "snapshot"), "prefix"), (error: unknown) => error instanceof ProjectImportError && error.code === "COMPRESSION_RATIO_LIMIT");
  });
});

test("ZIP import rejects content that fails the archive CRC integrity check", async () => {
  await withTempDirectory(async (directory) => {
    const archivePath = path.join(directory, "bad-checksum.zip");
    const archive = zipFixture([{ name: "src/file.txt", data: Buffer.from("verified content") }]);
    const endRecord = archive.length - 22;
    const centralOffset = archive.readUInt32LE(endRecord + 16);
    archive.writeUInt32LE((archive.readUInt32LE(centralOffset + 16) ^ 1) >>> 0, centralOffset + 16);
    await fs.writeFile(archivePath, archive);
    await assert.rejects(
      extractProjectZip(archivePath, path.join(directory, "snapshot"), "prefix"),
      (error: unknown) => error instanceof ProjectImportError && error.code === "INVALID_ARCHIVE",
    );
  });
});
