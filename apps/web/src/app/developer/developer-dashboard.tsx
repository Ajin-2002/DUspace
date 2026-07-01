"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Container from "@/components/layout/container";
import { useState } from "react";
import {
  Plus,
  LogOut,
  Package,
  Star,
  Download,
  TrendingUp,
  Settings,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Archive,
  Trash2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — swap for real API data.
// ---------------------------------------------------------------------------

const MOCK_APPS = [
  {
    id: 1,
    name: "TaskMaster Pro",
    tagline: "Project & task tracking for small teams",
    version: "2.4.1",
    size: "48.2 MB",
    platforms: ["macOS", "Windows", "Linux"],
    status: "live",
    installs: "12,400",
    rating: 4.7,
    revenue: "$1,240",
    icon: "📋",
    updated: "2 days ago",
    downloads: 842,
    views: 2450,
  },
  {
    id: 2,
    name: "WeatherNow",
    tagline: "Hyperlocal forecasts with offline radar",
    version: "1.0.0",
    size: "22.6 MB",
    platforms: ["iOS", "Android"],
    status: "review",
    installs: "—",
    rating: 0,
    revenue: "—",
    icon: "🌤️",
    updated: "Submitted 3 hours ago",
    downloads: 0,
    views: 125,
  },
  {
    id: 3,
    name: "PixelForge",
    tagline: "Lightweight sprite editor for indie devs",
    version: "0.9.2-beta",
    size: "15.1 MB",
    platforms: ["Windows", "Linux"],
    status: "draft",
    installs: "—",
    rating: 0,
    revenue: "—",
    icon: "🎮",
    updated: "Last edited 6 days ago",
    downloads: 0,
    views: 89,
  },
];

const DEV_STATS = [
  { label: "Published apps", value: "2", icon: Package, change: "+1 this month" },
  { label: "Total installs", value: "12.4K", icon: Download, change: "+2.3% vs last month" },
  { label: "Avg. rating", value: "4.7", icon: Star, change: "98% positive" },
  { label: "Revenue (30d)", value: "$1,240", icon: TrendingUp, change: "+12% vs last month" },
];

const STATUS_CONFIG = {
  live: {
    label: "Live",
    icon: CheckCircle,
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  review: {
    label: "In review",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  draft: {
    label: "Draft",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
};

export function DeveloperDashboard() {
  const { data: session } = useSession();
  const [hoveredApp, setHoveredApp] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F3] via-white to-[#FAF8F3] dark:from-[#0B1420] dark:via-[#0F1A2E] dark:to-[#0B1420] py-8 font-['Inter',sans-serif]">
      <Container>
        {/* ---------------------------------------------------------------- */}
        {/* Header with gradient background                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3B5C] via-[#1a4f6e] to-[#0a2a40] shadow-2xl">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FF8A3D]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#FF8A3D]/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <Avatar
                  src={session?.user?.image}
                  name={session?.user?.name}
                  // size="xl"
                  className="ring-4 ring-white/20 shadow-xl"
                />
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-white font-['Space_Grotesk',sans-serif]">
                      {session?.user?.name ?? "Developer Portal"}
                    </h1>
                    <Badge className="bg-[#FF8A3D] text-white hover:bg-[#ffa057] transition-colors">
                      Developer
                    </Badge>
                  </div>
                  <p className="mt-1 text-white/70">{session?.user?.email}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="font-mono text-xs text-white/40">
                      dev_8841 · member since 2024
                    </span>
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="inline-flex items-center gap-2 rounded-2xl bg-[#FF8A3D] px-5 py-3 text-sm font-semibold text-[#0F3B5C] shadow-lg shadow-[#FF8A3D]/25 transition-all hover:scale-105 hover:shadow-[#FF8A3D]/40 active:scale-95">
                  <Plus className="h-4 w-4" />
                  Upload new package
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {DEV_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/10 p-2 text-white/70 group-hover:bg-white/20">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xl font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-white/50">{stat.label}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-emerald-400/70">
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Apps section with better cards                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="mb-8">
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#0F3B5C]/60 dark:text-white/40">
                Published packages
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Space_Grotesk',sans-serif]">
                Your apps
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-400">
                {MOCK_APPS.length} total
              </span>
              <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-[#0F3B5C]/30 hover:bg-[#0F3B5C]/5 dark:border-white/15 dark:text-gray-300">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {MOCK_APPS.map((app) => {
              const status = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = status.icon;
              const isHovered = hoveredApp === app.id;

              return (
                <div
                  key={app.id}
                  className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-[#0F3B5C]/30 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                  onMouseEnter={() => setHoveredApp(app.id)}
                  onMouseLeave={() => setHoveredApp(null)}
                >
                  {/* Status badge */}
                  <div className="absolute right-4 top-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Icon & name */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 text-3xl dark:from-white/5 dark:to-white/10">
                      {app.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {app.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {app.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
                    <span className="font-mono">v{app.version}</span>
                    <span>•</span>
                    <span>{app.size}</span>
                    <span>•</span>
                    <span>{app.platforms.join(", ")}</span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                    <div className="text-center">
                      <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {app.installs}
                      </div>
                      <div className="text-[10px] text-gray-400">installs</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {app.rating > 0 ? (
                          <>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {app.rating}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">rating</div>
                    </div>
                    <div className="text-center">
                      <div className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {app.revenue}
                      </div>
                      <div className="text-[10px] text-gray-400">revenue</div>
                    </div>
                  </div>

                  {/* Action buttons - show on hover */}
                  <div className={`mt-4 flex items-center gap-2 transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button className="flex-1 rounded-xl bg-[#0F3B5C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a5a7a]">
                      Manage
                    </button>
                    <button className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:border-[#0F3B5C]/30 hover:text-[#0F3B5C] dark:border-white/15">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:border-red-300 hover:text-red-500 dark:border-white/15">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Update time */}
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" />
                    {app.updated}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Enhanced upload CTA                                             */}
        {/* ---------------------------------------------------------------- */}
        <Card className="relative overflow-hidden rounded-3xl border-2 border-dashed border-[#0F3B5C]/20 bg-gradient-to-br from-white via-gray-50 to-white py-16 text-center dark:border-white/15 dark:from-white/5 dark:via-white/10 dark:to-white/5">
          <div className="absolute inset-0 bg-[url('/dots.svg')] opacity-5" />
          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0F3B5C] to-[#1a5a7a] text-4xl shadow-xl shadow-[#0F3B5C]/20">
              📦
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Space_Grotesk',sans-serif]">
              Ready to ship your next app?
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Upload an installer or package, add release notes, and publish
              it for people to download and run on their own devices.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-[#0F3B5C] px-8 py-4 font-semibold text-white shadow-lg shadow-[#0F3B5C]/25 transition-all hover:scale-105 hover:shadow-[#0F3B5C]/40 active:scale-95">
                <Plus className="h-5 w-5" />
                Upload new package
              </button>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-8 py-4 font-medium text-gray-600 transition hover:border-[#0F3B5C]/30 hover:bg-[#0F3B5C]/5 dark:border-white/15 dark:text-gray-300">
                <ExternalLink className="h-5 w-5" />
                Documentation
              </button>
            </div>
            <p className="mt-4 font-mono text-xs text-gray-400">
              supports .exe, .dmg, .apk, .deb — up to 500 MB
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}