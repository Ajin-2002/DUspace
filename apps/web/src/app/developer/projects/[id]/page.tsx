"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe, Smartphone, Monitor, Server, Package, Terminal,
  LayoutTemplate, Wrench, GitBranch, ExternalLink, Tag,
  Calendar, Eye, Download, Star, ArrowRight, Loader2,
  Upload, Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  "web-app": "Web Application", "mobile-app": "Mobile Application",
  "desktop-app": "Desktop Application", "api-backend": "API / Backend",
  "library-package": "Library / Package", "cli-tool": "CLI Tool",
  "ui-component": "UI Component / Template", "developer-tool": "Developer Tool",
};

interface App {
  _id: string; name: string; slug: string; shortDescription?: string;
  description?: string; projectType: string; category: string;
  tags: string[]; languages: string[]; frameworks: string[]; license?: string;
  repositoryUrl?: string; documentationUrl?: string; websiteUrl?: string;
  status: string; visibility: string; currentVersion: string;
  rating: number; downloads: number; views: number;
  createdAt: string; updatedAt: string; publishedAt?: string;
  buildConfig: Record<string, string>;
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [app, setApp] = useState<App | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.token) return;
    fetch(getApiUrl(`/api/developer/apps/${id}`), {
      headers: { Authorization: `Bearer ${session.user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { setApp(d.app); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [session, id]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  );

  if (!app) return (
    <div className="text-center py-20 text-sm text-neutral-500">Project not found.</div>
  );

  const isPublished = app.status === "published";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left — main info */}
      <div className="space-y-6 lg:col-span-2">

        {/* Project info card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">{app.name}</h2>
              {app.shortDescription && (
                <p className="mt-1 text-sm text-neutral-500">{app.shortDescription}</p>
              )}
            </div>
            <Link
              href={`/developer/projects/${id}/settings`}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </Link>
          </div>

          {app.description && (
            <p className="text-sm text-neutral-600 leading-relaxed">{app.description}</p>
          )}

          {/* Tech badges */}
          {(app.languages.length > 0 || app.frameworks.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {app.languages.map((l) => (
                <span key={l} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100">{l}</span>
              ))}
              {app.frameworks.map((f) => (
                <span key={f} className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-purple-100">{f}</span>
              ))}
              {app.tags.map((t) => (
                <span key={t} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">{t}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-4">
            {[
              { label: "Type", value: PROJECT_TYPE_LABELS[app.projectType] || app.projectType },
              { label: "Category", value: app.category },
              { label: "License", value: app.license || "—" },
              { label: "Version", value: app.currentVersion !== "—" ? `v${app.currentVersion}` : "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
                <p className="mt-0.5 font-medium text-neutral-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        {(app.repositoryUrl || app.documentationUrl || app.websiteUrl) && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">Links</h3>
            <div className="space-y-2">
              {[
                { label: "Repository", url: app.repositoryUrl, icon: GitBranch },
                { label: "Documentation", url: app.documentationUrl, icon: ExternalLink },
                { label: "Website / Demo", url: app.websiteUrl, icon: Globe },
              ].filter((l) => l.url).map(({ label, url, icon: Icon }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition"
                >
                  <Icon className="h-4 w-4 text-neutral-400" />
                  <span className="font-medium">{label}</span>
                  <span className="ml-auto truncate text-xs text-neutral-400 max-w-[200px]">{url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Build config snapshot */}
        {(app.buildConfig?.buildCommand || app.buildConfig?.startCommand) && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Build configuration</h3>
              <Link href={`/developer/projects/${id}/configure`} className="text-xs text-neutral-400 hover:text-neutral-700 underline underline-offset-2">
                Edit
              </Link>
            </div>
            <div className="rounded-xl bg-neutral-950 p-4 space-y-2">
              {[
                { label: "Package Manager", val: app.buildConfig.packageManager },
                { label: "Build Command", val: app.buildConfig.buildCommand },
                { label: "Start Command", val: app.buildConfig.startCommand },
                { label: "Output Directory", val: app.buildConfig.outputDirectory },
              ].filter((r) => r.val).map(({ label, val }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-[11px] text-neutral-500">{label}</span>
                  <code className="font-mono text-xs text-emerald-400">{val}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions for draft */}
        {!isPublished && (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center space-y-4">
            <p className="text-sm font-medium text-neutral-700">Ready to share your project?</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/developer/projects/${id}/releases/new`}
                className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition"
              >
                <Tag className="h-4 w-4" /> Create a Release
              </Link>
              <Link
                href={`/developer/projects/${id}/import`}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                <Upload className="h-4 w-4" /> Upload Files
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="space-y-4">
        {/* Stats */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Stats</h3>
          {[
            { label: "Views", value: app.views.toLocaleString(), icon: Eye },
            { label: "Downloads", value: app.downloads.toLocaleString(), icon: Download },
            { label: "Rating", value: app.rating ? app.rating.toFixed(1) : "—", icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                <Icon className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="text-sm font-semibold text-neutral-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900">Project status</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: "Status", value: app.status, colored: true },
              { label: "Visibility", value: app.visibility },
              { label: "Created", value: new Date(app.createdAt).toLocaleDateString() },
              { label: "Last updated", value: new Date(app.updatedAt).toLocaleDateString() },
              ...(app.publishedAt ? [{ label: "Published", value: new Date(app.publishedAt).toLocaleDateString() }] : []),
            ].map(({ label, value, colored }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-neutral-500">{label}</span>
                <span className={cn(
                  "font-medium capitalize",
                  colored && value === "published" ? "text-emerald-600" :
                  colored && value === "archived" ? "text-neutral-400" :
                  colored ? "text-amber-600" : "text-neutral-900"
                )}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Go to releases */}
        <Link
          href={`/developer/projects/${id}/releases`}
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 transition group"
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-900">Releases</span>
          </div>
          <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
