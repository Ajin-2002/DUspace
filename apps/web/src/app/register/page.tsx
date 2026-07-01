"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SocialButton } from "@/components/ui/social-button";
import { cn } from "@/lib/utils";

type Role = "user" | "developer";

const ROLES: {
  value: Role;
  label: string;
  icon: string;
  description: string;
  perks: string[];
}[] = [
  {
    value: "user",
    label: "App User",
    icon: "🛍️",
    description: "Discover, download, and review apps",
    perks: ["Browse thousands of apps", "Leave reviews & ratings", "Wishlist & collections"],
  },
  {
    value: "developer",
    label: "Developer",
    icon: "🚀",
    description: "Publish and manage your own apps",
    perks: ["Publish unlimited apps", "Analytics dashboard", "Developer monetization"],
  },
];

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.replace(
        session.user.role === "developer" ? "/developer" : "/dashboard"
      );
    }
  }, [session, router]);

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    // Store selected role in sessionStorage so the auth callback can read it
    sessionStorage.setItem("pendingRole", selectedRole);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F3B5C] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20">
      {/* Background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/5" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#2D7FF9]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-lg animate-fade-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-[#0F3B5C] dark:text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F3B5C] to-[#2D7FF9] text-lg text-white shadow-lg">
              D
            </span>
            DUspace
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Choose how you want to use DUspace
          </p>
        </div>

        <div className="card-surface p-8">
          {/* Role selection */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              I want to join as…
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  id={`role-${role.value}`}
                  onClick={() => setSelectedRole(role.value)}
                  className={cn(
                    "flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all duration-200",
                    selectedRole === role.value
                      ? "border-[#2D7FF9] bg-blue-50 shadow-md shadow-blue-100 dark:bg-blue-950/30 dark:shadow-blue-900/20"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                  )}
                >
                  <span className="mb-2 text-2xl">{role.icon}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {role.label}
                  </span>
                  <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {role.description}
                  </span>
                  <ul className="mt-3 space-y-1">
                    {role.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <span className="text-emerald-500">✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {selectedRole === role.value && (
                    <div className="mt-3 flex h-5 w-5 items-center justify-center self-end rounded-full bg-[#2D7FF9] text-white">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Google Sign Up */}
          <SocialButton
            provider="google"
            label={`Sign up with Google as ${selectedRole === "developer" ? "Developer" : "User"}`}
            onClick={handleGoogleSignUp}
            isLoading={isLoading}
          />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 dark:bg-[#0d1b2e] dark:text-gray-500">
                email/password coming in Phase 3
              </span>
            </div>
          </div>

          {/* Sign in link */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#2D7FF9] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
