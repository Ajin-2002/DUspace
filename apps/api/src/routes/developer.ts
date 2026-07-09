import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { requireAuth, requireDeveloper, AuthRequest } from "../middleware/auth";

const router = Router();

function signToken(id: string, role: "user" | "developer", isDeveloper: boolean): string {
  return jwt.sign({ id, role, isDeveloper }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

// ─── POST /api/developer/register ─────────────────────────────────────────────
// Upgrades a regular user account to also have developer privileges.
// No separate account needed — same session, instant upgrade.
router.post("/register", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.isDeveloper) {
      res.status(409).json({ error: "Account already has developer privileges" });
      return;
    }

    const { displayName, bio, website } = req.body;

    if (!displayName || !displayName.trim()) {
      res.status(400).json({ error: "Display name is required" });
      return;
    }

    // Upgrade the account
    user.isDeveloper = true;
    user.role = "developer";
    user.developerStatus = "approved"; // Auto-approve for now
    user.developerProfile = {
      displayName: displayName.trim(),
      bio: bio?.trim() || undefined,
      website: website?.trim() || undefined,
      registeredAt: new Date(),
    };

    await user.save();

    // Issue a fresh JWT with developer flag
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
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

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
    if (!user || !user.developerProfile) {
      res.status(404).json({ error: "Developer profile not found" });
      return;
    }

    const { displayName, bio, website } = req.body;

    if (displayName !== undefined) {
      if (!displayName.trim()) {
        res.status(400).json({ error: "Display name cannot be empty" });
        return;
      }
      user.developerProfile.displayName = displayName.trim();
    }
    if (bio !== undefined) {
      user.developerProfile.bio = bio?.trim() || undefined;
    }
    if (website !== undefined) {
      user.developerProfile.website = website?.trim() || undefined;
    }

    await user.save();

    res.json({
      message: "Developer profile updated",
      developerProfile: user.developerProfile,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
