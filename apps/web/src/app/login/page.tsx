"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* LEFT SIDE - Brand/Info */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-center bg-neutral-900 px-12 py-10 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }} />
        </div>

        {/* Animated dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <style>{`
            @keyframes floatUp {
              0% { transform: translateY(100%) scale(0); opacity: 0; }
              10% { opacity: 0.2; }
              90% { opacity: 0.2; }
              100% { transform: translateY(-100vh) scale(1); opacity: 0; }
            }
            .dot-particle {
              position: absolute;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.08);
              will-change: transform, opacity;
              animation: floatUp linear infinite;
            }
          `}</style>
          {Array.from({ length: 15 }).map((_, i) => {
            const size = Math.floor(Math.random() * 6) + 2;
            const left = Math.random() * 100;
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 20;

            return (
              <div
                key={i}
                className="dot-particle"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  animationDuration: `${duration}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium text-white/60">
            <Shield className="h-3 w-3" />
            Secure Access
          </div>

          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            Welcome back to<br />
            <span className="text-neutral-400">your DUspace</span>
          </h1>

          <p className="mt-3 max-w-sm text-sm text-neutral-400 leading-relaxed">
            Sign in to access your applications, manage your profile,
            and discover new tools from our curated directory.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 max-w-sm">
            {[
              { label: "2,500+ Apps", icon: Sparkles },
              { label: "Secure Login", icon: Shield },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70">
                <div className="flex items-center gap-1.5">
                  <item.icon className="h-3 w-3 text-neutral-500" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-5 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-neutral-600" />
              Encrypted data
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-neutral-600" />
              Secure access
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-neutral-600" />
              24/7 support
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 px-6 py-6 lg:px-8">
        <div className="w-full max-w-110">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-medium text-neutral-600">
                <Lock className="h-3 w-3" />
                Sign In
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-900">
                Welcome back
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Sign in to access your account
              </p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-sm disabled:opacity-70"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLoading ? "Signing in..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2.5 text-[10px] text-neutral-400">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-3">
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-neutral-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="block text-xs font-medium text-neutral-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 pl-9 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                />
                <label htmlFor="remember" className="text-[10px] text-neutral-500">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-neutral-700 hover:shadow-sm disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <div className="mt-4 text-center text-xs text-neutral-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-neutral-900 transition hover:text-neutral-600 hover:underline"
              >
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}