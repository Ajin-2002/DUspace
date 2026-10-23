"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Tag,
  Rocket,
  BarChart2,
  MessageSquare,
  Settings,
  ArrowLeft,
  Globe,
  Smartphone,
  Monitor,
  Server,
  Package,
  Terminal,
  LayoutTemplate,
  Wrench,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

const PROJECT_TYPE_ICONS: Record<string, React.ElementType> = {
  "web-app": Globe,
  "mobile-app": Smartphone,
  "desktop-app": Monitor,
  "api-backend": Server,
  "library-package": Package,
  "cli-tool": Terminal,
  "ui-component": LayoutTemplate,
  "developer-tool": Wrench,
};

const NAV = [
  { id: "overview", label: "Overview", href: "", icon: LayoutDashboard },
  { id: "releases", label: "Releases", href: "/releases", icon: Tag },
  {
    id: "deployments",
    label: "Deployments",
    href: "/deployments",
    icon: Rocket,
  },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart2 },
  { id: "reviews", label: "Reviews", href: "/reviews", icon: MessageSquare },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

interface ProjectInfo {
  name: string;
  slug: string;
  status: string;
  projectType: string;
  currentVersion: string;
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [project, setProject] = useState<ProjectInfo | null>(null);

  useEffect(() => {
    if (!session?.user?.token || !id) return;
    fetch(getApiUrl(`/api/developer/apps/${id}`), {
      headers: { Authorization: `Bearer ${session.user.token}` },
    })
      .then((r) => r.json())
      .then((d) => d.app && setProject(d.app))
      .catch(() => {});
  }, [session, id]);

  const base = `/developer/projects/${id}`;
  const TypeIcon = PROJECT_TYPE_ICONS[project?.projectType || ""] || Globe;

  return (
    <div className="space-y-0">
      {/* Project header */}
      <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_-15px_rgba(15,23,42,0.2)] sm:p-5">
        <div className="flex items-center gap-3">
          <Link
            href="/developer/apps"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-950 text-white shadow-sm">
            <TypeIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-950">
              {project?.name ?? "Loading…"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  project?.status === "published"
                    ? "bg-emerald-100 text-emerald-700"
                    : project?.status === "archived"
                      ? "bg-neutral-100 text-neutral-500"
                      : "bg-amber-100 text-amber-700",
                )}
              >
                {project?.status ?? "draft"}
              </span>
              {project?.currentVersion && project.currentVersion !== "—" && (
                <span className="font-mono text-[11px] text-slate-400">
                  v{project.currentVersion}
                </span>
              )}
            </div>
          </div>
        </div>
        {project?.status === "published" && (
          <a
            href={`/apps/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View public page
          </a>
        )}
      </div>

      {/* Tab nav */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {NAV.map((item) => {
          const href = `${base}${item.href}`;
          const isActive =
            item.href === "" ? pathname === base : pathname.startsWith(href);

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all",
                isActive
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
