import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import connectDB from "./db";
import authRouter from "./routes/auth";
import developerRouter from "./routes/developer";
import appsRouter, { publicAppsRouter } from "./routes/apps";
import releasesRouter from "./routes/releases";
import projectWorkspacesRouter, { recoverAbandonedProjectImports } from "./routes/project-workspaces";
import { analysesRouter, projectAnalysesRouter } from "./routes/project-analyses";
import { runProjectAnalysisWorkers } from "./workers/project-analysis-worker";
import designLibraryRouter from "./routes/design-library";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
function normalizeOrigin(value: string): string {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return "";
  }
}

const allowedClientOrigins = new Set(
  [process.env.CLIENT_URL, ...(process.env.CLIENT_URLS || "").split(",")]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizeOrigin)
    .filter(Boolean),
);
if (!allowedClientOrigins.size) allowedClientOrigins.add("http://localhost:3000");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedClientOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (cover images, project files, etc.)
app.use("/uploads", express.static(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")));


// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/developer", developerRouter);
app.use("/api/developer", appsRouter);
app.use("/api/developer/apps/:appId/releases", releasesRouter);
app.use("/api/apps", publicAppsRouter);
app.use("/api/v1/projects", projectWorkspacesRouter);
app.use("/api/v1/projects", projectAnalysesRouter);
app.use("/api/v1/analyses", analysesRouter);
app.use("/api/v1/design-library", designLibraryRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  await recoverAbandonedProjectImports();
  void runProjectAnalysisWorkers().catch(() => {
    console.error("Project analysis worker could not start. Analysis requests will remain queued.");
  });
  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
  });
}

start();
