import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";
import { Extract } from "unzipper";

export interface ZipValidation {
  isValid: boolean;
  error?: string;
  fileCount?: number;
  totalSize?: number;
}

export interface ExtractedZip {
  extractPath: string;
  fileList: string[];
  rootDir: string;
}

/**
 * Validate ZIP file integrity
 */
export async function validateZip(zipPath: string): Promise<ZipValidation> {
  try {
    const stats = await fs.stat(zipPath);
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (stats.size > maxSize) {
      return { isValid: false, error: "ZIP file exceeds 500MB limit" };
    }

    if (stats.size === 0) {
      return { isValid: false, error: "ZIP file is empty" };
    }

    // Check ZIP file signature (0x504B0304)
    const buffer = Buffer.alloc(4);
    const fd = await fs.open(zipPath, "r");
    await fd.read(buffer, 0, 4, 0);
    await fd.close();

    const signature = buffer.readUInt32LE(0);
    if (signature !== 0x04034b50) {
      return { isValid: false, error: "Invalid ZIP file format" };
    }

    return { isValid: true, totalSize: stats.size };
  } catch (err) {
    return {
      isValid: false,
      error: `ZIP validation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Extract ZIP file and return directory structure
 */
export async function extractZip(zipPath: string, extractDir: string): Promise<ExtractedZip> {
  try {
    // Create extraction directory
    await fs.mkdir(extractDir, { recursive: true });

    // Extract ZIP
    await new Promise<void>((resolve, reject) => {
      createReadStream(zipPath)
        .pipe(Extract({ path: extractDir }))
        .on("close", resolve)
        .on("error", reject);
    });

    // Get file list
    const fileList: string[] = [];
    const rootFiles = await fs.readdir(extractDir);

    // Check if ZIP has single root directory
    let rootDir = extractDir;
    if (rootFiles.length === 1) {
      const singleItem = path.join(extractDir, rootFiles[0]);
      const stat = await fs.stat(singleItem);
      if (stat.isDirectory()) {
        rootDir = singleItem;
      }
    }

    // Recursively get all files
    async function walkDir(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(extractDir, fullPath);
        fileList.push(relativePath);

        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          await walkDir(fullPath);
        }
      }
    }

    await walkDir(extractDir);

    return { extractPath: extractDir, fileList, rootDir };
  } catch (err) {
    throw new Error(
      `ZIP extraction failed: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

/**
 * Clean up extracted files
 */
export async function cleanupZip(extractDir: string): Promise<void> {
  try {
    await fs.rm(extractDir, { recursive: true, force: true });
  } catch (err) {
    console.error("Failed to cleanup extracted files:", err);
  }
}
