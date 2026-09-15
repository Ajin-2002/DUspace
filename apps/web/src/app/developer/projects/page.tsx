"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Globe, Smartphone, Monitor, Server, Package, Terminal,
  LayoutTemplate, Wrench, Plus, Search, Filter,
  Loader2, MoreHorizontal, Tag, Settings, Upload, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

const PROJECT_TYPE_ICONS: Record<string, React.ElementType> = {
  "web-app": Globe, "mobile-app": Smartphone, "desktop-app": Monitor,
  "api-backend": Server, "library-package": Package, "cli-tool": Terminal,
  "ui-component": LayoutTemplate, "developer-tool": Wrench,
};
const PROJECT_TYPE_LABELS: Record<string, string> = {
  "web-app": "Web App", "mobile-app": "Mobile", "desktop-app": "Desktop",
  "api-backend": "API / Backend", "library-package": "Library", "cli-tool": "CLI Tool",
  "ui-component": "UI Component", "developer-tool": "Dev Tool",
};

type StatusFilter = "all" | "draft" | "published" | "archived";

interface Project {
  _id: string; name: string; slug: string; shortDescription?: string;
  projectType: string; category: string; status: string; currentVersion: string;
  createdAt: string; updatedAt: string;
  coverImage?: string;
}

export default function MyProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.token) return;
    setIsLoading(true);
    fetch(getApiUrl("/api/developer/apps"), {
      headers: { Authorization: `Bearer ${session.user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { setProjects(d.apps || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project permanently?")) return;
    setDeletingId(id);
    await fetch(getApiUrl(`/api/developer/apps/${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.user?.token}` },
    });
    setProjects((prev) => prev.filter((p) => p._id !== id));
    setDeletingId(null);
  };

  const filtered = projects.filter((p) => {
    const matchesStatus = filter === "all" || p.status === filter;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: projects.length,
    draft: projects.filter((p) => p.status === "draft").length,
    published: projects.filter((p) => p.status === "published").length,
    archived: projects.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">My Projects</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Manage all your projects in one place.</p>
        </div>
        <Link
          href="/developer/projects/new"
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 transition"
        >
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-900 focus:outline-none transition"
          />
        </div>
        <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1 gap-1">
          {(["all", "draft", "published", "archived"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize whitespace-nowrap",
                filter === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {f} <span className="rounded-full bg-neutral-200 px-1.5 text-[10px] font-semibold text-neutral-600">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 mb-4">
            <Package className="h-7 w-7 text-neutral-500" />
          </div>
          <p className="text-base font-semibold text-neutral-900">
            {search ? "No matching projects" : "No projects yet"}
          </p>
          <p className="mt-1 text-sm text-neutral-500 mb-6">
            {search ? "Try a different search term." : "Create your first project to get started."}
          </p>
          {!search && (
            <Link href="/developer/projects/new" className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition">
              <Plus className="h-4 w-4" /> Create project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const TypeIcon = PROJECT_TYPE_ICONS[project.projectType] || Globe;
            return (
              <div key={project._id} className="group relative rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-md transition-all duration-200">
                <Link href={`/developer/projects/${project._id}`} className="absolute inset-0 rounded-2xl" />

                {project.coverImage ? (
                  <div className="mb-4 h-32 overflow-hidden rounded-xl bg-neutral-100">
                    <img src={getApiUrl(project.coverImage)} alt={`${project.name} cover`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {!project.coverImage && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
                        <TypeIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-neutral-900 leading-tight">{project.name}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{PROJECT_TYPE_LABELS[project.projectType] || project.projectType}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    project.status === "published" ? "bg-emerald-100 text-emerald-700" :
                    project.status === "archived" ? "bg-neutral-100 text-neutral-500" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {project.status}
                  </span>
                </div>

                {project.shortDescription && (
                  <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{project.shortDescription}</p>
                )}

                <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{project.category}</span>
                    {project.currentVersion && project.currentVersion !== "—" && (
                      <span className="font-mono">v{project.currentVersion}</span>
                    )}
                  </div>
                  {/* Quick actions (relative to stacking context) */}
                  <div className="relative z-10 flex gap-1">
                    <Link
                      href={`/developer/projects/${project._id}/releases/new`}
                      title="Create release"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition"
                    >
                      <Tag className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/developer/projects/${project._id}/settings`}
                      title="Settings"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(project._id)}
                      disabled={deletingId === project._id}
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                    >
                      {deletingId === project._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
