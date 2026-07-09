"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AuthGuardProps = {
  children: React.ReactNode;
  /**
   * When true, only users who have registered as a developer can access this route.
   * Regular users (isDeveloper: false) are redirected to /dashboard.
   * 
   * Since accounts are unified (one account, multiple roles), the user dashboard
   * NEVER uses this flag — any authenticated user can always access their user space.
   */
  developerOnly?: boolean;
  redirectTo?: string;
};

export function AuthGuard({
  children,
  developerOnly = false,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Not logged in at all — send to login
    if (!session) {
      router.replace(redirectTo);
      return;
    }

    // Developer-only route but user hasn't registered as a developer
    if (developerOnly && !session.user.isDeveloper) {
      router.replace("/dashboard");
      return;
    }

    // Developers can ALWAYS access /dashboard (unified account).
    // No redirect needed for that case.
  }, [session, status, developerOnly, redirectTo, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-900 border-t-transparent" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — render nothing (redirect happening in useEffect)
  if (!session) return null;

  // Developer-only gate
  if (developerOnly && !session.user.isDeveloper) return null;

  return <>{children}</>;
}
