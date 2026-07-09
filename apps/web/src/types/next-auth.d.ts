import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "user" | "developer";
      isDeveloper: boolean;
      developerStatus?: "none" | "pending" | "approved" | "rejected";
      developerProfile?: {
        displayName: string;
        bio?: string;
        website?: string;
        registeredAt: string | Date;
      };
      token?: string;
    };
  }

  interface User {
    role?: "user" | "developer";
    isDeveloper?: boolean;
    developerStatus?: "none" | "pending" | "approved" | "rejected";
    developerProfile?: {
      displayName: string;
      bio?: string;
      website?: string;
      registeredAt: string | Date;
    };
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "developer";
    isDeveloper: boolean;
    developerStatus?: "none" | "pending" | "approved" | "rejected";
    developerProfile?: {
      displayName: string;
      bio?: string;
      website?: string;
      registeredAt: string | Date;
    };
    token?: string;
  }
}

