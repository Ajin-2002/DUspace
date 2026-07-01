"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SocialButton } from "@/components/ui/social-button";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.replace(
        session.user.role === "developer" ? "/developer" : "/dashboard"
      );
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
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
      {/* Animated background blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#2D7FF9]/10 blur-3xl dark:bg-[#2D7FF9]/5" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#0F3B5C]/10 blur-3xl dark:bg-[#0F3B5C]/20" />
      </div>

      <div className="w-full max-w-md animate-fade-up">
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
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in to access your apps and dashboard
          </p>
        </div>

        {/* Card */}
        <div className="card-surface p-8">
          {/* Google Sign In */}
          <SocialButton
            provider="google"
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
          />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 dark:bg-[#0d1b2e] dark:text-gray-500">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-3">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#2D7FF9] focus:outline-none focus:ring-1 focus:ring-[#2D7FF9] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#2D7FF9]"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#2D7FF9] focus:outline-none focus:ring-1 focus:ring-[#2D7FF9] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#2D7FF9]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full rounded-xl bg-[#0F3B5C] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0F3B5C]/90 focus:outline-none focus:ring-2 focus:ring-[#0F3B5C] focus:ring-offset-2 disabled:opacity-70 dark:bg-[#2D7FF9] dark:hover:bg-[#2D7FF9]/90"
            >
              {isLoading ? "Signing in..." : "Sign in with Email"}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[#2D7FF9] hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
