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
    <div className="space-y-7">
      {/* ── Hero Banner ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-[0_18px_60px_-38px_rgba(15,23,42,0.18)] sm:p-8 lg:p-9">
        {/* dot grid */}
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #475569 1px, transparent 0)",
            backgroundSize: "25px 25px",
          }}
        />
        {/* glow blobs */}
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-slate-300/60 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-zinc-200/70 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            {/* Greeting */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-slate-500" />
              Your personal workspace
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
              Your app collection, saved picks, and activity are all together in
              one place.
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
              >
                <Grid3X3 className="h-4 w-4" />
                Browse Store
              </Link>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white">
                <MessageSquare className="h-4 w-4" />
                Write a Review
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Installed apps", value: "0", icon: Package },
              { label: "Saved for later", value: "0", icon: Heart },
              { label: "Reviews written", value: "0", icon: Star },
              { label: "Downloads", value: "0", icon: Download },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/80 bg-white/75 p-3.5 shadow-sm backdrop-blur-sm sm:p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-slate-500">
                    {s.label}
                  </p>
                  <s.icon className="h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Links Grid ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "My Apps",
            icon: Package,
            href: "/dashboard/my-apps",
            desc: "View installed apps",
          },
          {
            label: "Downloads",
            icon: Download,
            href: "/dashboard/downloads",
            desc: "Active & history",
          },
          {
            label: "Favorites",
            icon: Heart,
            href: "/dashboard/favorites",
            desc: "Your wishlist",
          },
          {
            label: "Reviews",
            icon: Star,
            href: "/dashboard/reviews",
            desc: "Manage reviews",
          },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex min-h-[170px] flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.2)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_35px_-22px_rgba(15,23,42,0.2)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-100 transition group-hover:bg-slate-900">
              <item.icon className="h-5 w-5 text-slate-700 transition group-hover:text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {item.desc}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-900" />
          </Link>
        ))}
      </div>

      {/* ── Developer Space Prompt (only if not a developer yet) ── */}
      {!isDeveloper && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-100 via-white to-zinc-100 p-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-slate-200 blur-2xl opacity-60" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
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
              className="shrink-0 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Developer Space — already a dev ────────── */}
      {isDeveloper && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-100 via-white to-zinc-100 p-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-slate-200 blur-2xl opacity-60" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
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
              className="shrink-0 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Recent Activity ─────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.25)] sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-900">
              Recent activity
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              A timeline of what you&apos;ve been up to.
            </p>
          </div>
          <Clock className="h-4 w-4 text-neutral-400" />
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Sparkles className="h-6 w-6 text-slate-500" />
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
