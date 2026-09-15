import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import connectDB from "./db";
import authRouter from "./routes/auth";
import developerRouter from "./routes/developer";
import appsRouter, { publicAppsRouter } from "./routes/apps";
import releasesRouter from "./routes/releases";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (cover images, project files, etc.)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/developer", developerRouter);
app.use("/api/developer", appsRouter);
app.use("/api/developer/apps/:appId/releases", releasesRouter);
app.use("/api/apps", publicAppsRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
  });
}

start();

