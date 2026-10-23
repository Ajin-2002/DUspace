import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const publicUploadRoot = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
);
const privateRoot = path.resolve(
  process.env.PROJECT_STORAGE_DIR || path.join(process.cwd(), "private-projects"),
);

if (privateRoot === publicUploadRoot || privateRoot.startsWith(publicUploadRoot + path.sep)) {
  throw new Error("PROJECT_STORAGE_DIR must be outside the public UPLOAD_DIR");
}

export const projectStorageRoot = privateRoot;

export function newSnapshotKey(): string {
  return crypto.randomUUID();
}

export function stagingDirectory(ownerId: string, projectId: string, importId: string): string {
  return path.join(privateRoot, ".staging", ownerId, projectId, importId);
}

export function snapshotDirectory(ownerId: string, projectId: string, key: string): string {
  return path.join(privateRoot, ownerId, projectId, "original", key);
}

export async function removeImportStaging(
  ownerId: string,
  projectId: string,
  importId: string,
): Promise<void> {
  await fs.rm(stagingDirectory(ownerId, projectId, importId), {
    recursive: true,
    force: true,
  });
}

export async function removeProjectStorage(ownerId: string, projectId: string): Promise<void> {
  await fs.rm(path.join(privateRoot, ownerId, projectId), {
    recursive: true,
    force: true,
  });
  await fs.rm(path.join(privateRoot, ".staging", ownerId, projectId), {
    recursive: true,
    force: true,
  });
}
