import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = Router();

function signToken(id: string, role: "user" | "developer", isDeveloper: boolean): string {
  return jwt.sign({ id, role, isDeveloper }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // All new users start as regular users — they can upgrade to developer later
    const user = new User({
      name,
      email,
      password,
      role: "user",
      isDeveloper: false,
      developerStatus: "none",
    });

    await user.save();

    const token = signToken(user._id.toString(), user.role, user.isDeveloper);

    res.status(201).json({
      message: "Account created",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDeveloper: user.isDeveloper,
        developerStatus: user.developerStatus,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Explicitly select password (it's hidden by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const match = await user.comparePassword(password);
    if (!match) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken(user._id.toString(), user.role, user.isDeveloper);

    res.json({
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
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── POST /api/auth/oauth ─────────────────────────────────────────────────────
// Create or retrieve a user from OAuth (Google) sign-in
router.post("/oauth", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, image } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new OAuth user
      user = new User({
        name: name || email,
        email,
        avatar: image,
        role: "user",
        isDeveloper: false,
        developerStatus: "none",
        googleId: email, // Use email as googleId for identification
      });
      await user.save();
    } else if (!user.avatar && image) {
      // Update avatar if not set
      user.avatar = image;
      await user.save();
    }

    const token = signToken(user._id.toString(), user.role, user.isDeveloper);

    res.json({
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
    console.error("OAuth error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
import { requireAuth, AuthRequest } from "../middleware/auth";

router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
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
      role: user.role,
      avatar: user.avatar,
      isDeveloper: user.isDeveloper,
      developerStatus: user.developerStatus,
      developerProfile: user.developerProfile,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

