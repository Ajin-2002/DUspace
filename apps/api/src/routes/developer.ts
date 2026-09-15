import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import App from "../models/App";
import { requireAuth, requireDeveloper, AuthRequest } from "../middleware/auth";

const router = Router();

function signToken(id: string, role: "user" | "developer", isDeveloper: boolean): string {
  return jwt.sign({ id, role, isDeveloper }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
}

// ─── POST /api/developer/register ─────────────────────────────────────────────
router.post("/register", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (user.isDeveloper) { res.status(409).json({ error: "Account already has developer privileges" }); return; }

    const { displayName, bio, website } = req.body;
    if (!displayName?.trim()) { res.status(400).json({ error: "Display name is required" }); return; }

    user.isDeveloper = true;
    user.role = "developer";
    user.developerStatus = "approved";
    user.developerProfile = {
      displayName: displayName.trim(),
      bio: bio?.trim() || undefined,
      website: website?.trim() || undefined,
      skills: [],
      registeredAt: new Date(),
    };

    await user.save();
    const token = signToken(user._id.toString(), user.role, user.isDeveloper);

    res.status(200).json({
      message: "Developer registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDeveloper: user.isDeveloper,
        developerStatus: user.developerStatus,
        developerProfile: user.developerProfile,
      },
    });
  } catch (err) {
    console.error("Developer register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/developer/profile ───────────────────────────────────────────────
router.get("/profile", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      isDeveloper: user.isDeveloper,
      developerStatus: user.developerStatus,
      developerProfile: user.developerProfile,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── PUT /api/developer/profile ───────────────────────────────────────────────
router.put("/profile", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.developerProfile) { res.status(404).json({ error: "Developer profile not found" }); return; }

    const { displayName, bio, website, avatar, skills, githubUrl, twitterUrl, linkedinUrl } = req.body;

    if (displayName !== undefined) {
      if (!displayName.trim()) { res.status(400).json({ error: "Display name cannot be empty" }); return; }
      user.developerProfile.displayName = displayName.trim();
    }
    if (bio !== undefined) user.developerProfile.bio = bio?.trim() || undefined;
    if (website !== undefined) user.developerProfile.website = website?.trim() || undefined;
    if (avatar !== undefined) user.developerProfile.avatar = avatar?.trim() || undefined;
    if (skills !== undefined) user.developerProfile.skills = Array.isArray(skills) ? skills : [];
    if (githubUrl !== undefined) user.developerProfile.githubUrl = githubUrl?.trim() || undefined;
    if (twitterUrl !== undefined) user.developerProfile.twitterUrl = twitterUrl?.trim() || undefined;
    if (linkedinUrl !== undefined) user.developerProfile.linkedinUrl = linkedinUrl?.trim() || undefined;

    await user.save();
    res.json({ message: "Developer profile updated", developerProfile: user.developerProfile });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/developer/stats ─────────────────────────────────────────────────
router.get("/stats", requireDeveloper, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalProjects, publishedProjects, draftProjects, archivedProjects, allApps] = await Promise.all([
      App.countDocuments({ developerId: req.userId }),
      App.countDocuments({ developerId: req.userId, status: "published" }),
      App.countDocuments({ developerId: req.userId, status: "draft" }),
      App.countDocuments({ developerId: req.userId, status: "archived" }),
      App.find({ developerId: req.userId }).select("views downloads rating").lean(),
    ]);

    const totalViews = allApps.reduce((s, a) => s + (a.views || 0), 0);
    const totalDownloads = allApps.reduce((s, a) => s + (a.downloads || 0), 0);
    const rated = allApps.filter((a) => a.rating && a.rating > 0);
    const avgRating = rated.length ? rated.reduce((s, a) => s + (a.rating || 0), 0) / rated.length : 0;

    res.json({
      totalProjects,
      publishedProjects,
      draftProjects,
      archivedProjects,
      totalViews,
      totalDownloads,
      avgRating: Math.round(avgRating * 10) / 10,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
