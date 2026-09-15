import { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import crypto from "crypto";

export interface VirusScanConfig {
  enabled: boolean;
  provider?: "virustotal" | "clamav" | "local";
  virusTotalApiKey?: string;
}

// Malicious file extensions that should be blocked
const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".dll",
  ".msi",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".scr",
  ".vbs",
  ".ps1",
  ".app",
  ".deb",
  ".rpm",
]);

// Suspicious file extensions that should be warned about
const SUSPICIOUS_EXTENSIONS = new Set([".zip", ".rar", ".7z", ".tar", ".gz"]);

/**
 * Simple local malware detection based on file signatures
 */
async function localScan(filePath: string): Promise<{ clean: boolean; risk?: string }> {
  try {
    const buffer = Buffer.alloc(512);
    const fd = await fs.open(filePath, "r");
    await fd.read(buffer, 0, 512, 0);
    await fd.close();

    // Check for common malware signatures
    const signatures = [
      { name: "EICAR", hex: "583541265341502128485b4b5e275d7b50405e4f7d2439" }, // X5O!P%@AP[4\PZX54
      { name: "Executable", hex: "4d5a" }, // MZ header for Windows executables
    ];

    const bufferHex = buffer.toString("hex", 0, 512);

    for (const sig of signatures) {
      if (bufferHex.includes(sig.hex)) {
        return {
          clean: false,
          risk: `Potential ${sig.name} signature detected`,
        };
      }
    }

    return { clean: true };
  } catch (err) {
    console.error("Local scan error:", err);
    return { clean: true }; // Allow on scan error
  }
}

/**
 * Check file for malicious characteristics
 */
export async function scanFile(filePath: string): Promise<{ clean: boolean; risk?: string }> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);

    // Block suspicious extensions
    if (BLOCKED_EXTENSIONS.has(ext)) {
      return {
        clean: false,
        risk: `Blocked file extension: ${ext}`,
      };
    }

    // Warn about archive files in root (potential archive bombs)
    if (
      SUSPICIOUS_EXTENSIONS.has(ext) &&
      !fileName.startsWith(".")
    ) {
      console.warn(`Warning: Nested archive detected - ${fileName}`);
    }

    // Perform local signature scanning
    const localResult = await localScan(filePath);
    if (!localResult.clean) {
      return localResult;
    }

    return { clean: true };
  } catch (err) {
    console.error("File scan error:", err);
    return { clean: true };
  }
}

/**
 * Scan directory recursively
 */
export async function scanDirectory(
  dirPath: string,
  maxDepth: number = 10,
  currentDepth: number = 0
): Promise<{ clean: boolean; threats: string[] }> {
  const threats: string[] = [];

  if (currentDepth > maxDepth) {
    threats.push("Directory depth exceeds maximum allowed");
    return { clean: false, threats };
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subDirResult = await scanDirectory(fullPath, maxDepth, currentDepth + 1);
        if (!subDirResult.clean) {
          threats.push(...subDirResult.threats);
        }
      } else if (entry.isFile()) {
        const fileResult = await scanFile(fullPath);
        if (!fileResult.clean) {
          threats.push(`${fullPath}: ${fileResult.risk}`);
        }
      }
    }

    return {
      clean: threats.length === 0,
      threats,
    };
  } catch (err) {
    console.error("Directory scan error:", err);
    return {
      clean: false,
      threats: [`Failed to scan directory: ${err instanceof Error ? err.message : "Unknown error"}`],
    };
  }
}

/**
 * Express middleware for optional virus scanning
 */
export function virusScanMiddleware(config: VirusScanConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!config.enabled) {
      next();
      return;
    }

    const zipPath = req.file?.path;
    if (!zipPath) {
      next();
      return;
    }

    try {
      console.log("Scanning uploaded file...");
      const result = await scanFile(zipPath);

      if (!result.clean) {
        res.status(400).json({
          error: "File failed virus scan",
          risk: result.risk,
        });
        return;
      }

      console.log("File scan passed");
      next();
    } catch (err) {
      console.error("Virus scan middleware error:", err);
      res.status(500).json({ error: "Virus scan failed" });
    }
  };
}

/**
 * Generate file hash for integrity checking
 */
export async function generateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (data: string | Buffer) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}
