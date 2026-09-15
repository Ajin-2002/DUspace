import fs from "fs/promises";
import path from "path";

export type ProjectType =
  | "react"
  | "next"
  | "vue"
  | "angular"
  | "vite"
  | "svelte"
  | "remix"
  | "gatsby"
  | "nuxt"
  | "unknown";

export type PackageManager = "npm" | "yarn" | "pnpm";

export interface ProjectDetection {
  type: ProjectType;
  packageManager: PackageManager;
  buildScript: string;
  outputDir: string;
  packageJson?: Record<string, unknown>;
}

const PROJECT_INDICATORS: Record<ProjectType, { files: string[]; keywords: string[] }> = {
  next: { files: ["next.config.js", "next.config.ts", "next.config.mjs"], keywords: ["next"] },
  react: {
    files: ["craco.config.js", ".env.react-app"],
    keywords: ["react", "react-dom", "react-scripts"],
  },
  vite: { files: ["vite.config.js", "vite.config.ts"], keywords: ["vite"] },
  vue: {
    files: ["vue.config.js", ".nuxtignore"],
    keywords: ["vue", "vue-router", "vuex"],
  },
  angular: { files: ["angular.json"], keywords: ["@angular/core"] },
  svelte: { files: ["svelte.config.js"], keywords: ["svelte"] },
  remix: { files: ["remix.config.js"], keywords: ["@remix-run/react"] },
  gatsby: { files: ["gatsby-config.js"], keywords: ["gatsby"] },
  nuxt: { files: ["nuxt.config.js", "nuxt.config.ts"], keywords: ["nuxt"] },
  unknown: { files: [], keywords: [] },
};

/**
 * Detect project type from package.json and config files
 */
export async function detectProjectType(projectRoot: string): Promise<ProjectDetection> {
  try {
    const packageJsonPath = path.join(projectRoot, "package.json");
    let packageJson: Record<string, unknown> = {};
    let dependencies: string[] = [];

    // Read package.json if exists
    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      packageJson = JSON.parse(content);
      const deps = {
        ...((packageJson.dependencies as Record<string, unknown>) || {}),
        ...((packageJson.devDependencies as Record<string, unknown>) || {}),
      };
      dependencies = Object.keys(deps);
    } catch (err) {
      // No package.json found
    }

    // Detect project type
    let detectedType: ProjectType = "unknown";
    for (const [type, indicators] of Object.entries(PROJECT_INDICATORS)) {
      if (type === "unknown") continue;

      // Check for config files
      for (const file of indicators.files) {
        try {
          await fs.access(path.join(projectRoot, file));
          detectedType = type as ProjectType;
          break;
        } catch {
          // File doesn't exist
        }
      }

      if (detectedType !== "unknown") break;

      // Check for keywords in dependencies
      if (indicators.keywords.some((kw) => dependencies.some((dep) => dep.includes(kw)))) {
        detectedType = type as ProjectType;
        break;
      }
    }

    // Detect package manager
    let packageManager: PackageManager = "npm";
    try {
      await fs.access(path.join(projectRoot, "pnpm-lock.yaml"));
      packageManager = "pnpm";
    } catch {
      try {
        await fs.access(path.join(projectRoot, "yarn.lock"));
        packageManager = "yarn";
      } catch {
        // Default to npm
      }
    }

    // Determine build script and output directory
    const buildScript = (packageJson.scripts as Record<string, unknown>)?.build as string;
    let outputDir = "dist";

    // Project-specific output directory detection
    if (detectedType === "next") {
      outputDir = ".next";
    } else if (detectedType === "angular") {
      outputDir = "dist/angular";
    } else if (detectedType === "gatsby") {
      outputDir = "public";
    } else if (detectedType === "nuxt") {
      outputDir = ".output/public";
    }

    return {
      type: detectedType,
      packageManager,
      buildScript: buildScript || "build",
      outputDir,
      packageJson,
    };
  } catch (err) {
    console.error("Project detection error:", err);
    return {
      type: "unknown",
      packageManager: "npm",
      buildScript: "build",
      outputDir: "dist",
    };
  }
}

/**
 * Get static output directory for different project types
 */
export function getStaticOutputDir(
  projectType: ProjectType,
  projectRoot: string
): string {
  const outputDirs: Record<ProjectType, string> = {
    next: path.join(projectRoot, ".next"),
    react: path.join(projectRoot, "build"),
    vite: path.join(projectRoot, "dist"),
    vue: path.join(projectRoot, "dist"),
    angular: path.join(projectRoot, "dist/angular"),
    svelte: path.join(projectRoot, "build"),
    remix: path.join(projectRoot, "public/build"),
    gatsby: path.join(projectRoot, "public"),
    nuxt: path.join(projectRoot, ".output/public"),
    unknown: path.join(projectRoot, "dist"),
  };

  return outputDirs[projectType] || outputDirs.unknown;
}
