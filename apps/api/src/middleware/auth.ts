import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "user" | "developer";
  isDeveloper?: boolean;
}

interface JwtPayload {
  id: string;
  role: "user" | "developer";
  isDeveloper: boolean;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.isDeveloper = decoded.isDeveloper ?? false;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireDeveloper(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  requireAuth(req, res, () => {
    if (!req.isDeveloper) {
      res.status(403).json({ error: "Developer access required" });
      return;
    }
    next();
  });
}

