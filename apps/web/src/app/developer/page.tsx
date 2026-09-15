"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Download, Star, Eye, Package, Tag, Plus, ArrowRight, Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

interface Stats {
  totalProjects: number;
  publishedProjects: number;
  draftProjects: number;
  archivedProjects: number;
  totalViews: number;
  totalDownloads: number;
  avgRating: number;
}

interface RecentProject {
  _id: string;
  name: string;
  status: string;
  projectType: string;
  currentVersion: string;
  updatedAt: string;
  coverImage?: string;
}

export default function DeveloperDashboardOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.token) return;
    const authHeader = { Authorization: `Bearer ${session.user.token}` };

    Promise.all([
      fetch(getApiUrl("/api/developer/stats"), { headers: authHeader }).then((r) => r.json()),
      fetch(getApiUrl("/api/developer/apps"), { headers: authHeader }).then((r) => r.json()),
    ]).then(([statsData, appsData]) => {
      setStats(statsData);
      setRecentProjects((appsData.apps || []).slice(0, 5));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, [session]);

  const displayName = session?.user?.developerProfile?.displayName || session?.user?.name || "Developer";

  const statCards = [
    { label: "Total Projects",   value: stats?.totalProjects ?? "—",  icon: Package, sub: `${stats?.publishedProjects ?? 0} published` },
    { label: "Total Views",      value: stats?.totalViews ?? "—",     icon: Eye,     sub: "Across all projects" },
    { label: "Total Downloads",  value: stats?.totalDownloads ?? "—", icon: Download,sub: "All time" },
    { label: "Avg. Rating",      value: stats?.avgRating ? stats.avgRating.toFixed(1) : "—", icon: Star, sub: "Across published apps" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome back, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Here's an overview of your projects and activity.
          </p>
        </div>
        <Link
          href="/developer/projects/new"
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <Icon className="h-5 w-5 text-neutral-700" />
            </div>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-100" />
            ) : (
              <p className="text-2xl font-bold text-neutral-900">{value}</p>
            )}
            <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
            <p className="mt-2 text-[11px] text-neutral-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Published", value: stats.publishedProjects, color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
            { label: "Drafts",    value: stats.draftProjects,     color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" },
            { label: "Archived",  value: stats.archivedProjects,  color: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" },
          ].map(({ label, value, color, dot }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-lg font-bold`}>
                {value}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">{label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className="text-xs text-neutral-400">
                    {stats.totalProjects > 0 ? Math.round((value / stats.totalProjects) * 100) : 0}% of total
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent projects */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-neutral-900">Recent projects</h2>
          <Link href="/developer/projects" className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-neutral-500">No projects yet.</p>
            <Link href="/developer/projects/new" className="mt-3 text-xs font-medium text-neutral-900 underline underline-offset-2">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentProjects.map((project) => (
              <Link
                key={project._id}
                href={`/developer/projects/${project._id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition"
              >
                {project.coverImage ? (
                  <img src={getApiUrl(project.coverImage)} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white text-xs font-bold shrink-0">
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{project.name}</p>
                  <p className="text-xs text-neutral-400">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                  project.status === "published" ? "bg-emerald-100 text-emerald-700" :
                  project.status === "archived" ? "bg-neutral-100 text-neutral-500" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {project.status}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Create new project", desc: "Start the publishing workflow", href: "/developer/projects/new", icon: Plus },
          { label: "View all releases",  desc: "Manage versions across projects", href: "/developer/releases", icon: Tag },
        ].map(({ label, desc, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-sm transition group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition">
              <Icon className="h-5 w-5 text-neutral-600 group-hover:text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">{label}</p>
              <p className="text-xs text-neutral-500">{desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}