"use client";

import { Fragment, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, Code2, File, FileArchive, Folder, FolderOpen, Loader2, Palette, Search, Trash2 } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { ProjectAnalysisPanel } from "@/components/developer/project-analysis-panel";

interface Workspace {
  id: string; name: string; description: string; sourceType: "zip" | "folder";
  status: string; framework?: string; language?: string; fileCount: number;
  totalSizeBytes: number; createdAt: string; updatedAt: string;
}
interface ProjectFile { path: string; size: number; mimeType: string; sha256: string }
interface TreeNode { name: string; path: string; directory: boolean; children: Map<string, TreeNode> }

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function buildTree(files: ProjectFile[]): TreeNode {
  const root: TreeNode = { name: "", path: "", directory: true, children: new Map() };
  for (const file of files) {
    const segments = file.path.split("/");
    let current = root;
    for (let index = 0; index < segments.length; index += 1) {
      const name = segments[index];
      const isFile = index === segments.length - 1;
      let child = current.children.get(name);
      if (!child) {
        child = { name, path: segments.slice(0, index + 1).join("/"), directory: !isFile, children: new Map() };
        current.children.set(name, child);
      }
      current = child;
    }
  }
  return root;
}

function TreeBranch({ node, depth, expanded, toggle }: { node: TreeNode; depth: number; expanded: Set<string>; toggle: (path: string) => void }): ReactNode {
  const isExpanded = expanded.has(node.path);
  const sortedChildren = [...node.children.values()].sort((left, right) => Number(right.directory) - Number(left.directory) || left.name.localeCompare(right.name));
  const Icon = node.directory ? (isExpanded ? FolderOpen : Folder) : File;
  return (
    <Fragment key={node.path}>
      <button type="button" onClick={() => node.directory && toggle(node.path)} disabled={!node.directory} className={`flex min-h-9 w-full items-center gap-2 rounded-lg pr-3 text-left text-sm transition ${node.directory ? "text-slate-700 hover:bg-slate-100" : "cursor-default text-slate-600"}`} style={{ paddingLeft: `${12 + depth * 18}px` }}>
        {node.directory ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />) : <span className="w-3.5 shrink-0" />}
        <Icon className={`h-4 w-4 shrink-0 ${node.directory ? "text-slate-500" : "text-slate-400"}`} />
        <span className="min-w-0 truncate">{node.name}</span>
      </button>
      {node.directory && isExpanded && sortedChildren.map((child) => <TreeBranch key={child.path} node={child} depth={depth + 1} expanded={expanded} toggle={toggle} />)}
    </Fragment>
  );
}

export default function WorkspaceDetailsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const token = session?.user?.token;
  const [project, setProject] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));
  const [deleting, setDeleting] = useState(false);
  const visibleError = error || (!token ? "Sign in as a developer to open this workspace." : "");
  const showLoading = loading && (sessionStatus === "loading" || Boolean(token));

  const loadWorkspace = useCallback(async () => {
    if (!token || !projectId) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(getApiUrl(`/api/v1/projects/${projectId}`), { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Project could not be loaded.");
      setProject(data.project);
      if (data.project.status === "ready") {
        const first = await fetch(getApiUrl(`/api/v1/projects/${projectId}/files?page=1&limit=500`), { headers });
        const firstData = await first.json();
        if (!first.ok) throw new Error(firstData.error || "The project file list could not be loaded.");
        let loaded: ProjectFile[] = firstData.files ?? [];
        const pages = Number(firstData.pagination?.pages ?? 1);
        for (let page = 2; page <= pages; page += 1) {
          const next = await fetch(getApiUrl(`/api/v1/projects/${projectId}/files?page=${page}&limit=500`), { headers });
          const nextData = await next.json();
          if (!next.ok) throw new Error(nextData.error || "The project file list could not be loaded.");
          loaded = loaded.concat(nextData.files ?? []);
        }
        setFiles(loaded);
      } else {
        setFiles([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Project could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    if (!token) return;
    const trigger = window.setTimeout(() => { void loadWorkspace(); }, 0);
    return () => window.clearTimeout(trigger);
  }, [loadWorkspace, token]);

  const tree = useMemo(() => buildTree(files.filter((file) => !search || file.path.toLowerCase().includes(search.toLowerCase()))), [files, search]);
  const toggleDirectory = (path: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(path)) next.delete(path); else next.add(path);
    return next;
  });

  async function deleteWorkspace() {
    if (!token || !project || !window.confirm(`Permanently delete “${project.name}” and its private source files?`)) return;
    setDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/v1/projects/${projectId}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Project could not be deleted.");
      router.push("/developer/projects");
    } catch (deleteError) {
      window.alert(deleteError instanceof Error ? deleteError.message : "Project could not be deleted.");
      setDeleting(false);
    }
  }

  if (showLoading) return <main className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" aria-label="Loading project" /></main>;
  if (visibleError || !project) return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><div role="alert" className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-lg font-semibold text-slate-950">Project could not be opened</h1><p className="mt-2 text-sm text-slate-600">{visibleError || "This project is unavailable."}</p><div className="mt-5 flex gap-3"><button onClick={() => void loadWorkspace()} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Try again</button><Link href="/developer/projects" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Back to projects</Link></div></div></main>;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><Link href="/developer/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> My Projects</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{project.name}</h1><p className="mt-1 text-sm text-slate-600">{project.description || "Private project workspace"}</p></div>
        <div className="flex flex-wrap gap-2"><Link href={`/developer/design-library?projectId=${project.id}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Palette className="h-4 w-4" /> Design Library</Link><button type="button" disabled title="Code editing is planned for a future phase" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-500"><Code2 className="h-4 w-4" /> Open editor · Coming soon</button><button type="button" disabled={deleting} onClick={() => void deleteWorkspace()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button></div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Import status", project.status === "ready" ? "Ready" : project.status === "failed" ? "Import failed" : project.status],
          ["Source", project.sourceType === "zip" ? "ZIP archive" : "Local folder"],
          ["Files", project.fileCount.toLocaleString()],
          ["Imported size", formatSize(project.totalSizeBytes)],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1.5 truncate text-base font-semibold capitalize text-slate-950">{value}</p></div>)}
      </section>

      <ProjectAnalysisPanel key={project.id} projectId={project.id} token={token} ready={project.status === "ready"} />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div><h2 className="font-semibold text-slate-950">Project files</h2><p className="mt-0.5 text-xs text-slate-500">Browse paths only. Imported file contents are not rendered here.</p></div>
            <label className="relative w-full sm:max-w-60"><span className="sr-only">Search files</span><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a file" className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-slate-400" /></label>
          </div>
          {project.status !== "ready" ? <div className="p-8 text-center"><FileArchive className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">Files appear after import finishes</p><p className="mt-1 text-xs text-slate-500">Current status: {project.status}</p><Link href={`/developer/projects/new?projectId=${project.id}`} className="mt-4 inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Retry import</Link></div> : files.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No files match this search.</div> : <div className="max-h-[65vh] overflow-auto p-2"><div className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-800"><FolderOpen className="h-4 w-4 text-slate-500" /> Project root</div>{[...tree.children.values()].sort((left, right) => Number(right.directory) - Number(left.directory) || left.name.localeCompare(right.name)).map((node) => <TreeBranch key={node.path} node={node} depth={0} expanded={expanded} toggle={toggleDirectory} />)}</div>}
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-950">Project details</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-xs text-slate-500">Framework</dt><dd className="mt-0.5 font-medium text-slate-800">{project.framework || "Not detected"}</dd></div><div><dt className="text-xs text-slate-500">Primary language</dt><dd className="mt-0.5 font-medium text-slate-800">{project.language || "Not detected"}</dd></div><div><dt className="text-xs text-slate-500">Created</dt><dd className="mt-0.5 font-medium text-slate-800">{new Date(project.createdAt).toLocaleString()}</dd></div><div><dt className="text-xs text-slate-500">Last updated</dt><dd className="mt-0.5 font-medium text-slate-800">{new Date(project.updatedAt).toLocaleString()}</dd></div></dl></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-sm font-semibold text-slate-900">Original source preserved</h2><p className="mt-2 text-xs leading-5 text-slate-600">The imported source is saved in private storage. This workspace does not edit your original local folder, install packages, or execute project scripts.</p></div>
        </aside>
      </section>
    </main>
  );
}
