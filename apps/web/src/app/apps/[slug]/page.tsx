"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Globe,
  GitBranch,
  ExternalLink,
  Star,
  Download,
  Eye,
  Tag,
  Calendar,
  ArrowLeft,
  Loader2,
  Monitor,
  Package,
  ChevronRight,
  X,
  Maximize2,
  Code2,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  Productivity: "from-blue-500 to-cyan-400",
  Design: "from-purple-500 to-pink-400",
  Development: "from-emerald-500 to-teal-400",
  Marketing: "from-orange-500 to-amber-400",
  Education: "from-red-500 to-rose-400",
  Utilities: "from-indigo-500 to-violet-400",
  Media: "from-fuchsia-500 to-pink-400",
  Other: "from-neutral-500 to-neutral-700",
};

function getCategoryGradient(category: string) {
  return CATEGORY_COLORS[category] ?? "from-neutral-700 to-neutral-900";
}

interface PublicApp {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  projectType: string;
  category: string;
  tags: string[];
  languages: string[];
  frameworks: string[];
  license?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  websiteUrl?: string;
  status: string;
  currentVersion: string;
  rating: number;
  downloads: number;
  views: number;
  publishedAt?: string;
  createdAt: string;
  coverImage?: string;
  files: { originalName: string; filename: string; size: number; fileType: string }[];
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  "web-app": "Web App",
  "mobile-app": "Mobile App",
  "desktop-app": "Desktop App",
  "api-backend": "API / Backend",
  "library-package": "Library",
  "cli-tool": "CLI Tool",
  "ui-component": "UI Component",
  "developer-tool": "Dev Tool",
};

export default function PublicAppDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const [app, setApp] = useState<PublicApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(true);
  const [demoError, setDemoError] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleDownload = async (filename: string, originalName: string) => {
    if (!session?.user?.token) return;
    setDownloadingFile(filename);
    try {
      const response = await fetch(
        getApiUrl(`/api/apps/${encodeURIComponent(slug)}/files/${encodeURIComponent(filename)}`),
        { headers: { Authorization: `Bearer ${session.user.token}` } }
      );
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = originalName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Keep the page usable if a download fails.
    } finally {
      setDownloadingFile(null);
    }
  };

  useEffect(() => {
    fetch(getApiUrl(`/api/apps/${slug}`))
      .then((r) => r.json())
      .then((d) => { setApp(d.app ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <Package className="h-8 w-8 text-neutral-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-neutral-900">App not found</p>
          <p className="mt-1 text-sm text-neutral-500">This project may be private or doesn't exist.</p>
        </div>
        <Link href="/" className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const gradient = getCategoryGradient(app.category);
  const initial = app.name.charAt(0).toUpperCase();
  const hasDemo = !!app.websiteUrl;
  const hasLinks = app.repositoryUrl || app.documentationUrl || app.websiteUrl;

  return (
    <>
      {/* ── Live Demo Modal ─────────────────────────────────────────────────── */}
      {demoOpen && hasDemo && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
          {/* Modal header */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <div className="flex items-center gap-2.5">
              <div className={cn("flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-[11px] font-black text-white", gradient)}>
                {initial}
              </div>
              <span className="text-sm font-semibold text-white">{app.name}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Live Demo</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={app.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
              <button
                onClick={() => { setDemoOpen(false); setDemoLoading(true); setDemoError(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* iFrame */}
          <div className="relative flex-1">
            {demoLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                <p className="text-sm text-neutral-500">Loading demo…</p>
              </div>
            )}
            {demoError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800">
                  <Globe className="h-7 w-7 text-neutral-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Can't load demo</p>
                  <p className="mt-1 text-sm text-neutral-400">This site may restrict embedding. Open it directly instead.</p>
                </div>
                <a
                  href={app.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition"
                >
                  <ExternalLink className="h-4 w-4" /> Open Website
                </a>
              </div>
            ) : (
              <iframe
                src={app.websiteUrl}
                className="h-full w-full border-0"
                onLoad={() => setDemoLoading(false)}
                onError={() => { setDemoLoading(false); setDemoError(true); }}
                title={`${app.name} Live Demo`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
          </div>
        </div>
      )}

      {/* ── Page ────────────────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-neutral-50">
        {/* Cover image banner */}
        {app.coverImage && (
          <div className="relative h-48 sm:h-64 w-full bg-neutral-200 overflow-hidden">
            <img
              src={getApiUrl(app.coverImage)}
              alt={`${app.name} cover`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        {/* Hero banner */}
        <div className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-1.5 text-xs text-neutral-400">
              <Link href="/" className="hover:text-neutral-700 transition">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="capitalize text-neutral-600">{app.category}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-neutral-900 font-medium truncate max-w-[180px]">{app.name}</span>
            </nav>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* App icon */}
              <div className={cn("flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl font-black text-white shadow-lg", gradient)}>
                {initial}
              </div>

              {/* App meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-neutral-900">{app.name}</h1>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 capitalize">
                    {PROJECT_TYPE_LABELS[app.projectType] ?? app.projectType}
                  </span>
                  {app.currentVersion && app.currentVersion !== "—" && (
                    <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-mono text-neutral-500">
                      v{app.currentVersion}
                    </span>
                  )}
                </div>

                {app.shortDescription && (
                  <p className="text-[15px] text-neutral-600 leading-relaxed max-w-2xl">{app.shortDescription}</p>
                )}

                {/* Stats row */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                  {app.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-neutral-900">{app.rating.toFixed(1)}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {app.downloads.toLocaleString()} downloads
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {app.views.toLocaleString()} views
                  </span>
                  {app.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(app.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {hasDemo && (
                    <button
                      onClick={() => setDemoOpen(true)}
                      className="flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition shadow-sm"
                    >
                      <Monitor className="h-4 w-4" />
                      View Live Demo
                    </button>
                  )}
                  {app.websiteUrl && (
                    <a
                      href={app.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <Globe className="h-4 w-4" />
                      Open Website
                      <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                    </a>
                  )}
                  {app.repositoryUrl && (
                    <a
                      href={app.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
                    >
                      <GitBranch className="h-4 w-4" />
                      Repository
                      <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Left — main content ─────────────────────────────────────── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Live Demo preview strip */}
              {hasDemo && (
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-red-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="h-3 w-3 rounded-full bg-emerald-400" />
                      </div>
                      <span className="ml-1 max-w-[260px] truncate rounded-md border border-neutral-100 bg-neutral-50 px-2.5 py-0.5 text-[11px] text-neutral-500">
                        {app.websiteUrl}
                      </span>
                    </div>
                    <button
                      onClick={() => setDemoOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-neutral-700 transition"
                    >
                      <Maximize2 className="h-3 w-3" /> Full Screen
                    </button>
                  </div>
                  {/* Mini preview */}
                  <div className="relative h-64 bg-neutral-100">
                    <iframe
                      src={app.websiteUrl}
                      className="h-full w-full border-0 pointer-events-none"
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin"
                      style={{ transform: "scale(0.75)", transformOrigin: "top left", width: "133.33%", height: "133.33%" }}
                    />
                    {/* Click overlay to open full demo */}
                    <button
                      onClick={() => setDemoOpen(true)}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 hover:bg-black/10 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-md backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity">
                        <Monitor className="h-4 w-4" /> Click to open full demo
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              {app.description && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <h2 className="mb-3 text-sm font-semibold text-neutral-900">About this project</h2>
                  <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">{app.description}</p>
                </div>
              )}

              {/* Tech stack */}
              {(app.languages.length > 0 || app.frameworks.length > 0 || app.tags.length > 0) && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <Code2 className="h-4 w-4 text-neutral-400" /> Tech Stack
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {app.languages.map((l) => (
                      <span key={l} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">{l}</span>
                    ))}
                    {app.frameworks.map((f) => (
                      <span key={f} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-100">{f}</span>
                    ))}
                    {app.tags.map((t) => (
                      <span key={t} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {hasLinks && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <h2 className="mb-3 text-sm font-semibold text-neutral-900">Links</h2>
                  <div className="space-y-2">
                    {[
                      { label: "Live Website / Demo", url: app.websiteUrl, icon: Globe, color: "text-emerald-600 bg-emerald-50 ring-emerald-100" },
                      { label: "Repository", url: app.repositoryUrl, icon: GitBranch, color: "text-blue-600 bg-blue-50 ring-blue-100" },
                      { label: "Documentation", url: app.documentationUrl, icon: ExternalLink, color: "text-purple-600 bg-purple-50 ring-purple-100" },
                    ].filter((l) => l.url).map(({ label, url, icon: Icon, color }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-neutral-100 px-4 py-3 hover:border-neutral-200 hover:bg-neutral-50 transition group"
                      >
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", color)}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900">{label}</p>
                          <p className="truncate text-xs text-neutral-400">{url}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-neutral-300 group-hover:text-neutral-500 transition shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {app.files.length > 0 && session?.user?.token && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-neutral-900">Project files</h2>
                    <span className="text-xs text-neutral-400">{app.files.length} file{app.files.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="space-y-2">
                    {app.files.map((file) => (
                      <button
                        key={file.filename}
                        type="button"
                        onClick={() => handleDownload(file.filename, file.originalName)}
                        disabled={downloadingFile === file.filename}
                        className="flex items-center gap-3 rounded-xl border border-neutral-100 px-4 py-3 transition hover:border-neutral-200 hover:bg-neutral-50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Download className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900">{file.originalName}</p>
                          <p className="text-xs text-neutral-400">
                            {file.fileType} · {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600">
                          {downloadingFile === file.filename ? "Downloading…" : "Download"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {app.files.length > 0 && !session?.user?.token && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <h2 className="text-sm font-semibold text-blue-900">Sign in to download</h2>
                  <p className="mt-1 text-xs text-blue-700">Create an account or sign in to download this project&apos;s files.</p>
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(`/apps/${app.slug}`)}`}
                    className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>

            {/* ── Right sidebar ───────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Stats */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-neutral-900">Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: "Rating", value: app.rating > 0 ? app.rating.toFixed(1) : "No ratings yet", icon: Star, accent: "text-amber-500 bg-amber-50" },
                    { label: "Downloads", value: app.downloads.toLocaleString(), icon: Download, accent: "text-blue-500 bg-blue-50" },
                    { label: "Views", value: app.views.toLocaleString(), icon: Eye, accent: "text-purple-500 bg-purple-50" },
                  ].map(({ label, value, icon: Icon, accent }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", accent)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">{label}</p>
                        <p className="text-sm font-semibold text-neutral-900">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project info */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-neutral-900">Project Info</h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: "Category", value: app.category },
                    { label: "Type", value: PROJECT_TYPE_LABELS[app.projectType] ?? app.projectType },
                    { label: "Version", value: app.currentVersion !== "—" ? `v${app.currentVersion}` : "—" },
                    { label: "License", value: app.license || "—" },
                    { label: "Published", value: app.publishedAt ? new Date(app.publishedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-neutral-500">{label}</span>
                      <span className="font-medium text-neutral-900 capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
                {[
                  { icon: ShieldCheck, label: "Verified project", sub: "Reviewed by our team", color: "text-emerald-600 bg-emerald-50" },
                  { icon: Clock, label: "Regularly updated", sub: `Last: ${new Date(app.createdAt).toLocaleDateString()}`, color: "text-blue-600 bg-blue-50" },
                ].map(({ icon: Icon, label, sub, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">{label}</p>
                      <p className="text-[11px] text-neutral-400">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Back */}
              <Link
                href="/"
                className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                <ArrowLeft className="h-4 w-4 text-neutral-400" />
                Back to Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
