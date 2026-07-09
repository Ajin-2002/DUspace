"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  Package,
  Star,
  Heart,
  Clock,
  ArrowRight,
  Grid3X3,
  Download,
  MessageSquare,
  Code,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const isDeveloper = session?.user?.isDeveloper;

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 p-8 text-white shadow-2xl">
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* glow blobs */}
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          {/* Greeting */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-amber-300" />
            Welcome back!
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-2 text-sm text-neutral-300 max-w-md">
            Your personal app hub. Discover, install, and manage apps — all in
            one place.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              <Grid3X3 className="h-4 w-4" />
              Browse Store
            </Link>
            <button className="flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/25">
              <MessageSquare className="h-4 w-4" />
              Write a Review
            </button>
          </div>

          {/* Mini Stats */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Apps Installed", value: "0" },
              { label: "Reviews Written", value: "0" },
              { label: "Wishlist Items", value: "0" },
              { label: "Downloads", value: "0" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/10 p-3 backdrop-blur-sm"
              >
                <p className="text-xs font-medium text-white/60">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Links Grid ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { label: "My Apps", icon: Package, href: "/dashboard/my-apps", desc: "View installed apps" },
          { label: "Downloads", icon: Download, href: "/dashboard/downloads", desc: "Active & history" },
          { label: "Favorites", icon: Heart, href: "/dashboard/favorites", desc: "Your wishlist" },
          { label: "Reviews", icon: Star, href: "/dashboard/reviews", desc: "Manage reviews" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 transition group-hover:bg-neutral-900">
              <item.icon className="h-5 w-5 text-neutral-600 transition group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{item.label}</p>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-300 transition group-hover:text-neutral-900 group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      {/* ── Developer Space Prompt (only if not a developer yet) ── */}
      {!isDeveloper && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100 blur-2xl opacity-60" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Code className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-neutral-900">
                Become a Developer
              </h3>
              <p className="mt-0.5 text-sm text-neutral-500">
                Publish your own apps and reach thousands of users on DUspace.
              </p>
            </div>
            <Link
              href="/dashboard/developer-space"
              className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Developer Space — already a dev ────────── */}
      {isDeveloper && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-100 blur-2xl opacity-60" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <Code className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-neutral-900">
                Developer Portal
              </h3>
              <p className="mt-0.5 text-sm text-neutral-500">
                Manage your published apps, analytics, and earnings.
              </p>
            </div>
            <Link
              href="/developer"
              className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Open Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Recent Activity ─────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900">Recent Activity</h3>
          <Clock className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <Sparkles className="h-7 w-7 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-900">
            Nothing here yet
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Install or review an app to see your activity feed.
          </p>
          <Link
            href="/"
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Browse the Store
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
