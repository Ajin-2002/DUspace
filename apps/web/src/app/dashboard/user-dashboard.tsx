"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/ui/card";
import Container from "@/components/layout/container";

const INSTALLED_APPS = [
  { name: "CodeFlow", developer: "ByteWorks", category: "Productivity", rating: 4.8, downloads: "2.1M", icon: "⚡" },
  { name: "PixelPro", developer: "DesignLab", category: "Design", rating: 4.6, downloads: "890K", icon: "🎨" },
  { name: "DataSync", developer: "CloudBase", category: "Utilities", rating: 4.5, downloads: "1.4M", icon: "🔄" },
];

const STATS = [
  { label: "Apps Installed", value: "12", icon: "📦" },
  { label: "Reviews Written", value: "7", icon: "⭐" },
  { label: "Wishlist Items", value: "24", icon: "❤️" },
];

export function UserDashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen py-10">
      <Container>
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={session?.user?.image}
              name={session?.user?.name}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session?.user?.name ?? "Welcome back"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.email}
              </p>
              <Badge variant="primary" className="mt-1.5">
                App User
              </Badge>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <span>Sign out</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="card-surface flex flex-col items-center gap-2 p-5 text-center"
            >
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Installed apps */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Installed Apps
            </h2>
            <a
              href="/apps"
              className="text-sm font-medium text-[#2D7FF9] hover:underline"
            >
              Browse more →
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INSTALLED_APPS.map((app) => (
              <AppCard key={app.name} {...app} />
            ))}
          </div>
        </div>

        {/* Explore CTA */}
        <div className="gradient-hero-bg rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold">Discover New Apps</h2>
          <p className="mt-2 text-sm text-blue-200">
            Explore thousands of apps built by independent developers.
          </p>
          <a
            href="/apps"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/30"
          >
            Explore Store →
          </a>
        </div>
      </Container>
    </div>
  );
}
