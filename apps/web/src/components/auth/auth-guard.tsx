"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: "user" | "developer";
  redirectTo?: string;
};

export function AuthGuard({
  children,
  requiredRole,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace(redirectTo);
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      // Redirect to the correct dashboard for the user's role
      const roleRedirect =
        session.user.role === "developer" ? "/developer" : "/dashboard";
      router.replace(roleRedirect);
    }
  }, [session, status, requiredRole, redirectTo, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F3B5C] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) return null;

  // Wrong role
  if (requiredRole && session.user.role !== requiredRole) return null;

  return <>{children}</>;
}
