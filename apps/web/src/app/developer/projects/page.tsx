"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, Clock3, FolderKanban, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { getApiUrl } from "@/lib/api";

type WorkspaceStatus = "created" | "uploading" | "validating" | "extracting" | "manifest" | "saving" | "ready" | "failed" | "deleting";
interface Workspace {
  id: string;
  name: string;
  description: string;
  sourceType: "zip" | "folder";
  status: WorkspaceStatus;
  framework?: string;
  language?: string;
  fileCount: number;
  totalSizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<WorkspaceStatus, string> = {
  created: "Ready to import", uploading: "Uploading", validating: "Validating", extracting: "Extracting",
  manifest: "Building file list", saving: "Saving", ready: "Ready", failed: "Import failed", deleting: "Deleting",
};

function statusStyle(status: WorkspaceStatus): string {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  if (["created", "uploading", "validating", "extracting", "manifest", "saving"].includes(status)) return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-slate-200 bg-white text-slate-500";
}

function readableSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function WorkspacesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = session?.user?.token;
  const [projects, setProjects] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [matchingCount, setMatchingCount] = useState(0);
  const [counts, setCounts] = useState({ total: 0, ready: 0, failed: 0, active: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const visibleError = error || (!token && sessionStatus !== "loading" ? "Sign in as a developer to manage workspaces." : "");
  const showLoading = loading && (sessionStatus === "loading" || Boolean(token));

  const loadProjects = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams({ q: search, status: statusFilter, sort, page: String(page), limit: "24" });
    try {
      const response = await fetch(getApiUrl(`/api/v1/projects?${params}`), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load projects.");
      setError("");
      setProjects(data.projects ?? []);
      setCounts(data.counts ?? { total: 0, ready: 0, failed: 0, active: 0 });
      setMatchingCount(data.pagination?.total ?? 0);
      setPageCount(Math.max(1, data.pagination?.pages ?? 1));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, statusFilter, token]);

  useEffect(() => {
    if (!token) return;
    const trigger = window.setTimeout(() => { void loadProjects(); }, 0);
    return () => window.clearTimeout(trigger);
  }, [loadProjects, token]);

  async function deleteProject(project: Workspace) {
    if (!token || !window.confirm(`Delete “${project.name}” and its imported files? This cannot be undone.`)) return;
    setDeleting(project.id);
    try {
      const response = await fetch(getApiUrl(`/api/v1/projects/${project.id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete this project.");
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setMatchingCount((current) => Math.max(0, current - 1));
      setCounts((current) => ({ ...current, total: Math.max(0, current.total - 1), ready: Math.max(0, current.ready - Number(project.status === "ready")), failed: Math.max(0, current.failed - Number(project.status === "failed")), active: Math.max(0, current.active - Number(["uploading", "validating", "extracting", "manifest", "saving"].includes(project.status))) }));
      if (projects.length === 1 && page > 1) setPage((current) => current - 1);
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : "Could not delete this project.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Developer workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">My Projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Import existing codebases into private workspaces. Your source files stay unchanged and are stored separately from marketplace releases.</p>
        </div>
        <Link href="/developer/projects/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Plus className="h-4 w-4" /> Import Project
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Project summary">
        {[
          ["Total projects", counts.total], ["Imported and ready", counts.ready], ["Active or failed", counts.failed + counts.active],
        ].map(([label, count]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{count}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by project name" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
          </label>
          <label className="sr-only" htmlFor="workspace-status">Filter by status</label>
          <select id="workspace-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400">
            <option value="all">All statuses</option><option value="ready">Ready</option><option value="created">Not imported</option><option value="failed">Failed</option><option value="active">In progress</option>
          </select>
          <label className="sr-only" htmlFor="workspace-sort">Sort projects</label>
          <select id="workspace-sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400">
            <option value="updated">Recently updated</option><option value="created">Recently created</option><option value="name">Project name</option>
          </select>
        </div>

        {showLoading ? (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-6 w-6 animate-spin text-slate-500" aria-label="Loading projects" /></div>
        ) : visibleError ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" /><div><p className="font-semibold text-slate-900">Projects could not be loaded</p><p className="mt-1 text-sm text-slate-600">{visibleError}</p></div></div><button onClick={() => void loadProjects()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Try again</button></div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100"><FolderKanban className="h-6 w-6 text-slate-600" /></div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">{search || statusFilter !== "all" ? "No matching projects" : "Your workspace is ready"}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{search || statusFilter !== "all" ? "Try changing the search or status filter." : "Import a ZIP or a local project folder to keep its original source files in a private workspace."}</p>
            {!search && statusFilter === "all" && <Link href="/developer/projects/new" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"><Plus className="h-4 w-4" /> Import Project</Link>}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article key={project.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/developer/workspaces/${project.id}`} className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                    <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><FolderKanban className="h-5 w-5" /></div><div className="min-w-0"><h2 className="truncate text-base font-semibold text-slate-950 group-hover:text-slate-700">{project.name}</h2><p className="mt-0.5 text-xs text-slate-500">{project.sourceType === "zip" ? "ZIP import" : "Folder import"}</p></div></div>
                  </Link>
                  <button type="button" onClick={() => void deleteProject(project)} disabled={deleting === project.id} aria-label={`Delete ${project.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="mt-3 text-xs text-slate-500">Created {new Date(project.createdAt).toLocaleDateString()}</p>
                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{project.description || "No project description"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(project.status)}`}>{STATUS_LABELS[project.status]}</span>
                  {project.framework && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{project.framework}</span>}
                  {project.language && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{project.language}</span>}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  <span>{project.status === "ready" ? `${project.fileCount.toLocaleString()} files · ${readableSize(project.totalSizeBytes)}` : "Open project"}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></span>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && !error && pageCount > 1 && <div className="flex items-center justify-between border-t border-slate-200 pt-4"><p className="text-xs text-slate-500">Showing {((page - 1) * 24) + 1}–{Math.min(page * 24, matchingCount)} of {matchingCount}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40">Previous</button><span className="px-2 py-2 text-xs tabular-nums text-slate-500">{page} / {pageCount}</span><button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40">Next</button></div></div>}
      </section>
    </main>
  );
}
