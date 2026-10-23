"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Archive, ArrowLeft, CheckCircle2, Folder, FolderOpen, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_FOLDER_BYTES = 200 * 1024 * 1024;
const MAX_FILES = 5000;
const EXCLUDED_DIRECTORIES = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo", ".cache", "coverage"]);

interface SelectedFolderFile { file: File; path: string }
interface DirectoryFileHandle { kind: "file"; name: string; getFile(): Promise<File> }
interface DirectoryDirectoryHandle { kind: "directory"; name: string; values(): AsyncIterable<DirectoryEntryHandle> }
type DirectoryEntryHandle = DirectoryFileHandle | DirectoryDirectoryHandle;
interface WorkspaceStatusResponse { status: string; progressStage: string; errorCode?: string }

function formatSize(size: number): string {
  if (size < 1024) return `${size} bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function readError(response: Response): Promise<string> {
  const data = await response.json().catch(() => ({})) as { error?: string };
  return data.error || `Request failed (${response.status})`;
}

async function collectFolderFiles(directory: DirectoryDirectoryHandle): Promise<SelectedFolderFile[]> {
  const collected: SelectedFolderFile[] = [];
  async function visit(folder: DirectoryDirectoryHandle, prefix: string): Promise<void> {
    for await (const entry of folder.values()) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === "directory") {
        if (EXCLUDED_DIRECTORIES.has(entry.name.toLowerCase())) continue;
        await visit(entry, relativePath);
      } else {
        collected.push({ file: await entry.getFile(), path: relativePath });
        if (collected.length > MAX_FILES) throw new Error(`This folder has more than ${MAX_FILES.toLocaleString()} files.`);
      }
    }
  }
  await visit(directory, "");
  return collected;
}

export default function ImportWorkspacePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.user?.token;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<"zip" | "folder">("zip");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<SelectedFolderFile[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [stage, setStage] = useState("Preparing files");
  const [error, setError] = useState("");
  const [folderUnsupported, setFolderUnsupported] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    xhrRef.current?.abort();
  }, []);

  useEffect(() => {
    const requestedProjectId = new URLSearchParams(window.location.search).get("projectId");
    if (!requestedProjectId || !token) return;
    void Promise.resolve().then(() => setBusy(true));
    fetch(getApiUrl(`/api/v1/projects/${requestedProjectId}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The project could not be reopened.");
        const project = data.project as { id: string; name: string; description: string; sourceType: "zip" | "folder"; status: string };
        setProjectId(project.id);
        setName(project.name);
        setDescription(project.description);
        setSourceType(project.sourceType);
        if (project.status === "failed") setStage("Import failed");
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "The project could not be reopened."))
      .finally(() => setBusy(false));
  }, [token]);

  function selectSource(source: "zip" | "folder") {
    if (projectId || busy) return;
    setSourceType(source);
    setError("");
  }

  async function chooseFolder() {
    setError("");
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<DirectoryDirectoryHandle> }).showDirectoryPicker;
    if (!picker) {
      setFolderUnsupported(true);
      return;
    }
    setFolderUnsupported(false);
    try {
      const directory = await picker();
      const files = await collectFolderFiles(directory);
      const totalSize = files.reduce((total, item) => total + item.file.size, 0);
      if (!files.length) throw new Error("The selected folder does not contain any files to import.");
      if (totalSize > MAX_FOLDER_BYTES) throw new Error(`This folder exceeds the ${formatSize(MAX_FOLDER_BYTES)} expanded upload limit.`);
      setFolderFiles(files);
      setZipFile(null);
    } catch (pickerError) {
      if (pickerError instanceof DOMException && pickerError.name === "AbortError") return;
      setError(pickerError instanceof Error ? pickerError.message : "Could not read the selected folder.");
    }
  }

  function onZipChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    setZipFile(null);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".zip")) {
      setError("Choose a file with the .zip extension.");
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(`ZIP files must be no larger than ${formatSize(MAX_UPLOAD_BYTES)}.`);
      return;
    }
    setZipFile(selected);
  }

  async function refreshStage(id: string): Promise<WorkspaceStatusResponse | null> {
    if (!token) return null;
    try {
      const response = await fetch(getApiUrl(`/api/v1/projects/${id}/import-status`), { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return null;
      const data = await response.json() as WorkspaceStatusResponse;
      setStage(data.progressStage);
      return data;
    } catch {
      return null;
    }
  }

  function uploadFiles(id: string, importId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const body = new FormData();
      if (sourceType === "zip" && zipFile) {
        body.append("archive", zipFile, zipFile.name);
      } else {
        body.append("relativePaths", JSON.stringify(folderFiles.map((item) => item.path)));
        for (const item of folderFiles) body.append("files", item.file, item.file.name);
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", getApiUrl(`/api/v1/projects/${id}/uploads/complete?importId=${encodeURIComponent(importId)}`));
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setUploadPercent(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        xhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { project?: { id?: string }; status?: string };
            setStage("Import complete");
            resolve();
            router.push(`/developer/workspaces/${data.project?.id ?? id}`);
          } catch {
            reject(new Error("The server returned an invalid response."));
          }
          return;
        }
        let message = `Import failed (${xhr.status}).`;
        try { message = JSON.parse(xhr.responseText).error || message; } catch { /* retain safe fallback */ }
        reject(new Error(message));
      };
      xhr.onerror = () => {
        xhrRef.current = null;
        reject(new Error("The API could not be reached. Check that it is running, NEXT_PUBLIC_API_URL points to the deployed API, and the API allows this site in CLIENT_URL or CLIENT_URLS."));
      };
      xhr.onabort = () => { xhrRef.current = null; reject(new Error("Upload cancelled. You can retry this project.")); };
      xhr.send(body);
    });
  }

  async function startImport() {
    if (!token) { setError("Sign in as a developer to import a project."); return; }
    if (!projectId && !name.trim()) { setError("Enter a project name first."); return; }
    if (sourceType === "zip" && !zipFile) { setError("Choose a ZIP file to import."); return; }
    if (sourceType === "folder" && !folderFiles.length) { setError("Select a local folder to import."); return; }

    setBusy(true);
    setError("");
    setUploadPercent(0);
    setStage("Preparing files");
    let currentProjectId = projectId;
    try {
      if (!currentProjectId) {
        const createResponse = await fetch(getApiUrl("/api/v1/projects"), {
          method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim(), sourceType }),
        });
        if (!createResponse.ok) throw new Error(await readError(createResponse));
        const created = await createResponse.json() as { project: { id: string } };
        currentProjectId = created.project.id;
        setProjectId(currentProjectId);
      }

      const initResponse = await fetch(getApiUrl(`/api/v1/projects/${currentProjectId}/uploads`), {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, originalFilename: zipFile?.name }),
      });
      if (!initResponse.ok) throw new Error(await readError(initResponse));
      const initialized = await initResponse.json() as { importId: string; progressStage: string };
      setStage(initialized.progressStage);
      pollingRef.current = setInterval(() => { void refreshStage(currentProjectId as string); }, 1200);
      await uploadFiles(currentProjectId, initialized.importId);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "The project could not be imported.");
      if (currentProjectId) {
        const latest = await refreshStage(currentProjectId);
        if (latest?.status === "failed") setStage("Import failed");
      }
    } finally {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      xhrRef.current = null;
      setBusy(false);
    }
  }

  function cancelUpload() {
    xhrRef.current?.abort();
  }

  const selectedFileCount = sourceType === "zip" ? (zipFile ? 1 : 0) : folderFiles.length;
  const selectedBytes = sourceType === "zip" ? (zipFile?.size ?? 0) : folderFiles.reduce((total, item) => total + item.file.size, 0);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/developer/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to projects</Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Private project workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Import a project</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create a private copy of an existing codebase. DUspace will not modify your original local folder or run the imported code.</p>
      </header>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2"><span className="text-sm font-semibold text-slate-800">Project name <span className="text-rose-600">*</span></span><input value={name} onChange={(event) => setName(event.target.value)} disabled={busy || Boolean(projectId)} maxLength={100} placeholder="e.g. Customer portal" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50" /></label>
          <label className="space-y-2"><span className="text-sm font-semibold text-slate-800">Description <span className="font-normal text-slate-400">(optional)</span></span><input value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy || Boolean(projectId)} maxLength={2000} placeholder="What are you working on?" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50" /></label>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-800">Choose an import source</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button type="button" disabled={busy || Boolean(projectId)} onClick={() => selectSource("zip")} className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${sourceType === "zip" ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300"}`}>
              <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Archive className="h-5 w-5 text-slate-700" /></span><span><span className="block text-sm font-semibold text-slate-900">Upload a ZIP</span><span className="mt-0.5 block text-xs text-slate-500">One archive up to 100 MB</span></span></span>
            </button>
            <button type="button" disabled={busy || Boolean(projectId)} onClick={() => selectSource("folder")} className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${sourceType === "folder" ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300"}`}>
              <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Folder className="h-5 w-5 text-slate-700" /></span><span><span className="block text-sm font-semibold text-slate-900">Select a local folder</span><span className="mt-0.5 block text-xs text-slate-500">Browser folder access · up to 5,000 files</span></span></span>
            </button>
          </div>
        </div>

        {sourceType === "zip" ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
            <label htmlFor="project-zip" className="flex cursor-pointer flex-col items-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"><Upload className="h-5 w-5 text-slate-700" /></span>
              <span className="mt-3 text-sm font-semibold text-slate-900">{zipFile ? zipFile.name : "Choose a project ZIP file"}</span>
              <span className="mt-1 text-xs text-slate-500">ZIP archives only, maximum {formatSize(MAX_UPLOAD_BYTES)}</span>
              {zipFile && <span className="mt-2 text-xs font-medium text-slate-600">{formatSize(zipFile.size)}</span>}
            </label>
            <input id="project-zip" type="file" accept=".zip,application/zip" onChange={onZipChange} disabled={busy} className="sr-only" />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
            <div className="flex flex-col items-center text-center"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"><FolderOpen className="h-5 w-5 text-slate-700" /></span><span className="mt-3 text-sm font-semibold text-slate-900">Choose the project folder on your device</span><span className="mt-1 text-xs text-slate-500">Excluded: node_modules, .git, .next, dist, build and common generated caches.</span>
              <button type="button" onClick={() => void chooseFolder()} disabled={busy} className="mt-4 h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50">Select folder</button>
              {folderFiles.length > 0 && <p className="mt-3 text-xs font-medium text-slate-600">{folderFiles.length.toLocaleString()} files · {formatSize(selectedBytes)}</p>}
            </div>
            {folderUnsupported && <p role="status" className="mt-4 rounded-lg bg-white p-3 text-xs leading-5 text-slate-600">Folder selection requires a browser that supports the File System Access API. Try a current Chromium-based browser, or import the project as a ZIP.</p>}
          </div>
        )}

        {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

        {busy && <div aria-live="polite" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2.5"><Loader2 className="h-4 w-4 animate-spin text-slate-700" /><span className="text-sm font-semibold text-slate-900">{stage}</span></div><span className="text-xs font-semibold tabular-nums text-slate-600">{uploadPercent}% uploaded</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-900 transition-[width] duration-200" style={{ width: `${uploadPercent}%` }} /></div>
          <button type="button" onClick={cancelUpload} disabled={uploadPercent >= 100} className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:cursor-default disabled:text-slate-400">{uploadPercent >= 100 ? "Server is processing the imported files" : "Cancel upload"}</button>
        </div>}

        {!busy && stage === "Import complete" && <p className="flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Import complete</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-5 text-slate-500">The imported source is stored in a private workspace. Dependencies are not installed and project scripts are never executed.</p>
          <button type="button" onClick={() => void startImport()} disabled={busy || (sourceType === "zip" ? !zipFile : !folderFiles.length)} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing</> : <><Upload className="h-4 w-4" /> {projectId ? "Retry import" : "Import project"}</>}
          </button>
        </div>
        {projectId && <button type="button" onClick={() => router.push("/developer/projects")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><X className="h-3.5 w-3.5" /> Leave this failed import</button>}
        <p className="sr-only">{selectedFileCount} selected items, {formatSize(selectedBytes)}</p>
      </section>
    </main>
  );
}
