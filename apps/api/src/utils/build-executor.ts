import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { PackageManager } from "./project-detector";

const execAsync = promisify(exec);

export interface BuildResult {
  success: boolean;
  error?: string;
  buildTime?: number;
  outputSize?: number;
}

/**
 * Install dependencies using the detected package manager
 */
export async function installDependencies(
  projectRoot: string,
  packageManager: PackageManager
): Promise<void> {
  return new Promise((resolve, reject) => {
    const commands: Record<PackageManager, string[]> = {
      npm: ["npm", "install"],
      yarn: ["yarn", "install"],
      pnpm: ["pnpm", "install"],
    };

    const [cmd, ...args] = commands[packageManager];

    console.log(`Installing dependencies with ${packageManager}...`);

    const child = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`Dependencies installed successfully`);
        resolve();
      } else {
        reject(new Error(`Dependency installation failed with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Dependency installation error: ${err.message}`));
    });
  });
}

/**
 * Build project using npm/yarn/pnpm run build
 */
export async function buildProject(
  projectRoot: string,
  packageManager: PackageManager,
  buildScript: string = "build"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const commands: Record<PackageManager, string[]> = {
      npm: ["npm", "run", buildScript],
      yarn: ["yarn", buildScript],
      pnpm: ["pnpm", "run", buildScript],
    };

    const [cmd, ...args] = commands[packageManager];

    console.log(`Building project with ${packageManager}...`);

    const child = spawn(cmd, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`Build completed successfully`);
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Build error: ${err.message}`));
    });
  });
}

/**
 * Check if output directory exists and get its size
 */
export async function getOutputSize(outputDir: string): Promise<number> {
  try {
    await fs.access(outputDir);

    async function calculateSize(dir: string): Promise<number> {
      let size = 0;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          size += await calculateSize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }

      return size;
    }

    return await calculateSize(outputDir);
  } catch {
    return 0;
  }
}

/**
 * Execute complete build pipeline: install → build
 */
export async function executeBuildPipeline(
  projectRoot: string,
  packageManager: PackageManager,
  buildScript: string,
  outputDir: string
): Promise<BuildResult> {
  const startTime = Date.now();

  try {
    // Install dependencies
    await installDependencies(projectRoot, packageManager);

    // Build project
    await buildProject(projectRoot, packageManager, buildScript);

    // Get output size
    const outputSize = await getOutputSize(outputDir);

    const buildTime = Date.now() - startTime;

    return {
      success: true,
      buildTime,
      outputSize,
    };
  } catch (err) {
    const buildTime = Date.now() - startTime;
    return {
      success: false,
      error: err instanceof Error ? err.message : "Build failed",
      buildTime,
    };
  }
}
