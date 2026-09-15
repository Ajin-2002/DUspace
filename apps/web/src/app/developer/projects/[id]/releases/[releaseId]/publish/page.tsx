"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ExternalLink, ShieldCheck, Globe, Tag, Code2 } from "lucide-react";
import { ReleaseChannelBadge } from "@/components/developer/release-channel-badge";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import Link from "next/link";

interface Project {
  name: string; slug: string; shortDescription?: string; description?: string;
  projectType: string; category: string; license?: string; languages: string[];
  frameworks: string[]; visibility: string; repositoryUrl?: string;
}
interface Release {
  version: string; title?: string; releaseNotes?: string; changelog?: string;
  channel: "alpha" | "beta" | "stable"; status: string; screenshots: string[];
}

export default function PublishReleasePage() {
  const { id, releaseId } = useParams<{ id: string; releaseId: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [error, setError] = useState("");

  const authHeaders = { Authorization: `Bearer ${session?.user?.token}` };

  useEffect(() => {
    if (!session?.user?.token) return;
    Promise.all([
      fetch(getApiUrl(`/api/developer/apps/${id}`), { headers: authHeaders }).then((r) => r.json()),
      fetch(getApiUrl(`/api/developer/apps/${id}/releases/${releaseId}`), { headers: authHeaders }).then((r) => r.json()),
    ]).then(([projData, relData]) => {
      setProject(projData.app || null);
      setRelease(relData.release || null);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handlePublish = async () => {
    if (!confirmed) return;
    setIsPublishing(true);
    setError("");
    try {
      const res = await fetch(getApiUrl(`/api/developer/apps/${id}/releases/${releaseId}/publish`), {
        method: "PUT",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setPublicUrl(data.publicUrl || `/apps/${project?.slug}`);
      setPublished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      setIsPublishing(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  );

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Published! 🎉</h2>
          <p className="mt-2 text-sm text-neutral-500">Your release is now live and discoverable on DUspace.</p>
        </div>
        <a
          href={publicUrl}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          <ExternalLink className="h-4 w-4" />
          View public page
        </a>
        <Link href={`/developer/projects/${id}/releases`} className="text-sm text-neutral-400 hover:text-neutral-700 underline underline-offset-2">
          Back to releases
        </Link>
      </div>
    );
  }

  if (!project || !release) return (
    <div className="text-center py-20 text-sm text-neutral-500">Release not found.</div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Review & Publish</h1>
        <p className="mt-0.5 text-sm text-neutral-500">Confirm the details before making this release publicly available.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">

          {/* Project snapshot */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Project</h2>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">{project.name}</h3>
              {project.shortDescription && <p className="mt-1 text-sm text-neutral-500">{project.shortDescription}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
              {[
                { label: "Category",   value: project.category },
                { label: "License",    value: project.license || "—" },
                { label: "Visibility", value: project.visibility },
                { label: "Type",       value: project.projectType.replace(/-/g, " ") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
                  <p className="mt-0.5 font-medium text-neutral-900 capitalize">{value}</p>
                </div>
              ))}
            </div>
            {(project.languages.length > 0 || project.frameworks.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {project.languages.map((l) => (
                  <span key={l} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100">{l}</span>
                ))}
                {project.frameworks.map((f) => (
                  <span key={f} className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-purple-100">{f}</span>
                ))}
              </div>
            )}
          </div>

          {/* Release snapshot */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Release</h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-neutral-900">v{release.version}</span>
              <ReleaseChannelBadge channel={release.channel} />
            </div>
            {release.title && <p className="text-sm font-medium text-neutral-700">{release.title}</p>}
            {release.releaseNotes && (
              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Release Notes</p>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{release.releaseNotes}</p>
              </div>
            )}
            {release.changelog && (
              <div className="rounded-xl bg-neutral-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Changelog</p>
                <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap">{release.changelog}</pre>
              </div>
            )}
            {release.screenshots.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Screenshots ({release.screenshots.length})</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {release.screenshots.map((url, i) => (
                    <div key={i} className="aspect-video overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                      <img src={url} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Public URL preview */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-900">Public URL</h2>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
              <code className="flex-1 font-mono text-sm text-neutral-700">
                duspace.in/apps/{project.slug}
              </code>
            </div>
          </div>

          {/* Permission confirmation */}
          <div className={cn(
            "rounded-2xl border p-6 transition",
            confirmed ? "border-emerald-200 bg-emerald-50" : "border-neutral-200 bg-white"
          )}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="permission-confirm"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-emerald-600"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-900">I confirm I have permission to publish this project</p>
                <p className="mt-1 text-xs text-neutral-500">
                  I confirm that I own or have the right to distribute this project, it does not violate any third-party licenses,
                  and the content complies with DUspace's publishing guidelines.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">Publishing checklist</h3>
            <div className="space-y-2">
              {[
                { label: "Project name set", ok: !!project.name },
                { label: "Description added", ok: !!(project.shortDescription || project.description) },
                { label: "Version defined", ok: !!release.version },
                { label: "Release notes added", ok: !!release.releaseNotes },
                { label: "Permission confirmed", ok: confirmed },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2 className={cn("h-4 w-4", ok ? "text-emerald-500" : "text-neutral-200")} />
                  <span className={cn("text-sm", ok ? "text-neutral-700" : "text-neutral-400")}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            id="publish-release-btn"
            onClick={handlePublish}
            disabled={!confirmed || isPublishing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isPublishing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
            ) : (
              <><ShieldCheck className="h-4 w-4" /> Publish Release</>
            )}
          </button>

          <Link
            href={`/developer/projects/${id}/releases`}
            className="flex w-full items-center justify-center rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
