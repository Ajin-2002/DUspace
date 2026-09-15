"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, AlertTriangle, Trash2, Archive, Image as ImageIcon, X } from "lucide-react";
import { ProjectTypeSelector, ProjectType } from "@/components/developer/project-type-selector";
import { TagInput } from "@/components/developer/tag-input";
import { getApiUrl } from "@/lib/api";

const CATEGORIES = [
  "Productivity", "Design", "Development", "Marketing",
  "Education", "Utilities", "Entertainment", "Business",
  "Communication", "Security", "Finance", "Health", "Other",
];
const LICENSES = [
  "MIT", "Apache 2.0", "GPL v2", "GPL v3", "LGPL v2.1", "LGPL v3",
  "BSD 2-Clause", "BSD 3-Clause", "MPL 2.0", "AGPL v3", "ISC", "Proprietary", "Other",
];
const LANGUAGE_SUGGESTIONS = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C#", "C++", "Swift", "Kotlin", "Ruby", "PHP", "Dart"];
const FRAMEWORK_SUGGESTIONS = ["Next.js", "React", "Vue.js", "Angular", "Svelte", "Express", "FastAPI", "Django", "Flask", "NestJS", "Laravel", "Flutter", "React Native"];

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("web-app");
  const [category, setCategory] = useState("Utilities");
  const [tags, setTags] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [license, setLicense] = useState("MIT");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const authHeaders = { Authorization: `Bearer ${session?.user?.token}` };

  useEffect(() => {
    if (!session?.user?.token) return;
    fetch(getApiUrl(`/api/developer/apps/${id}`), { headers: authHeaders })
      .then((r) => r.json())
      .then(({ app }) => {
        if (!app) return;
        setName(app.name || "");
        setShortDescription(app.shortDescription || "");
        setDescription(app.description || "");
        setProjectType(app.projectType || "web-app");
        setCategory(app.category || "Utilities");
        setTags(app.tags || []);
        setLanguages(app.languages || []);
        setFrameworks(app.frameworks || []);
        setLicense(app.license || "MIT");
        setRepositoryUrl(app.repositoryUrl || "");
        setDocumentationUrl(app.documentationUrl || "");
        setWebsiteUrl(app.websiteUrl || "");
        setCoverImage(app.coverImage || "");
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSave = async () => {
    setIsSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name, shortDescription, description, projectType, category, tags, languages, frameworks, license, repositoryUrl, documentationUrl, websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Archive this project? It will be hidden from public view.")) return;
    setIsArchiving(true);
    await fetch(getApiUrl(`/api/developer/apps/${id}/archive`), { method: "PUT", headers: authHeaders });
    router.push("/developer/projects");
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ Permanently delete this project? This cannot be undone.")) return;
    setIsDeleting(true);
    await fetch(getApiUrl(`/api/developer/apps/${id}`), { method: "DELETE", headers: authHeaders });
    router.push("/developer/projects");
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setError("");
    const formData = new FormData();
    formData.append("cover", file);

    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/cover`), {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCoverImage(data.coverImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleCoverRemove = async () => {
    setIsUploadingCover(true);
    setError("");
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/cover`), {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");
      setCoverImage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setIsUploadingCover(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-neutral-900">Project Settings</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Edit project information and metadata.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* Cover image */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Cover image</h3>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative h-32 w-56 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                {coverImage ? (
                  <>
                    <img src={getApiUrl(coverImage)} alt="Cover" className="h-full w-full object-cover" />
                    <button
                      onClick={handleCoverRemove}
                      disabled={isUploadingCover}
                      className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-neutral-600 hover:text-red-600 shadow-sm transition disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="h-8 w-8 text-neutral-300" />
                )}
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-[2px]">
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-neutral-500">
                  This image will be displayed on the homepage cards and your project&apos;s public page. We recommend a 16:9 ratio image at least 800x450px.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition">
                    <ImageIcon className="h-4 w-4" />
                    Choose from computer
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <h3 className="text-sm font-semibold text-neutral-900">Basic information</h3>
            {[
              { id: "set-name",       label: "Project name",        value: name,             setter: setName,             placeholder: "My Awesome Project", type: "input" },
              { id: "set-short-desc", label: "Short description",   value: shortDescription, setter: setShortDescription, placeholder: "One-line summary",    type: "input" },
            ].map(({ id: fid, label, value, setter, placeholder }) => (
              <div key={fid}>
                <label htmlFor={fid} className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
                <input id={fid} type="text" value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition" />
              </div>
            ))}
            <div>
              <label htmlFor="set-description" className="block text-sm font-medium text-neutral-700 mb-1.5">Detailed description</label>
              <textarea id="set-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe your project…"
                className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition" />
            </div>
          </div>

          {/* Project type */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Project type</h3>
            <ProjectTypeSelector value={projectType} onChange={setProjectType} />
          </div>

          {/* Classification */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <h3 className="text-sm font-semibold text-neutral-900">Classification</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-neutral-900 focus:outline-none transition">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">License</label>
                <select value={license} onChange={(e) => setLicense(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:border-neutral-900 focus:outline-none transition">
                  {LICENSES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">Tags</label><TagInput value={tags} onChange={setTags} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">Languages</label><TagInput value={languages} onChange={setLanguages} suggestions={LANGUAGE_SUGGESTIONS} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 mb-1.5">Frameworks</label><TagInput value={frameworks} onChange={setFrameworks} suggestions={FRAMEWORK_SUGGESTIONS} /></div>
          </div>

          {/* Links */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900">Links</h3>
            {[
              { id: "set-repo", label: "Repository URL", value: repositoryUrl, setter: setRepositoryUrl },
              { id: "set-docs", label: "Documentation URL", value: documentationUrl, setter: setDocumentationUrl },
              { id: "set-site", label: "Website / Demo URL", value: websiteUrl, setter: setWebsiteUrl },
            ].map(({ id: fid, label, value, setter }) => (
              <div key={fid}>
                <label htmlFor={fid} className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
                <input id={fid} type="url" value={value} onChange={(e) => setter(e.target.value)} placeholder="https://"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none transition" />
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleArchive} disabled={isArchiving}
                className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition">
                {isArchiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                Archive project
              </button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete project
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-sm text-red-800">{error}</p></div>}
          {saved && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-medium text-emerald-800">✓ Changes saved successfully</p></div>}

          <button id="save-settings-btn" onClick={handleSave} disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 transition">
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
