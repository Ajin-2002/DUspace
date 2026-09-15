"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Tag, Clock, Plus, Loader2, Package } from "lucide-react";
import { ReleaseChannelBadge } from "@/components/developer/release-channel-badge";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

interface ProjectWithReleases {
  _id: string;
  name: string;
  slug: string;
}

interface Release {
  _id: string;
  projectId: string;
  version: string;
  title?: string;
  channel: "alpha" | "beta" | "stable";
  status: "draft" | "published";
  createdAt: string;
  publishedAt?: string;
}

interface ReleaseWithProject extends Release {
  projectName: string;
  projectSlug: string;
}

export default function AllReleasesPage() {
  const { data: session } = useSession();
  const [releases, setReleases] = useState<ReleaseWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.token) return;
    const authHeader = { Authorization: `Bearer ${session.user.token}` };

    fetch(getApiUrl("/api/developer/apps"), { headers: authHeader })
      .then((r) => r.json())
      .then(async ({ apps }: { apps: ProjectWithReleases[] }) => {
        if (!apps?.length) { setIsLoading(false); return; }
        const releaseArrays = await Promise.all(
          apps.map((app) =>
            fetch(getApiUrl(`/api/developer/apps/${app._id}/releases`), { headers: authHeader })
              .then((r) => r.json())
              .then((d) =>
                (d.releases || []).map((rel: Release) => ({
                  ...rel,
                  projectName: app.name,
                  projectSlug: app.slug,
                }))
              )
              .catch(() => [])
          )
        );
        const all = releaseArrays.flat().sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setReleases(all);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [session]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">All Releases</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Release history across all your projects.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 mb-4">
            <Tag className="h-7 w-7 text-neutral-500" />
          </div>
          <p className="text-base font-semibold text-neutral-900">No releases yet</p>
          <p className="mt-1 text-sm text-neutral-500 mb-6">Create your first project release to see it here.</p>
          <Link href="/developer/projects" className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition">
            <Package className="h-4 w-4" /> View projects
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-neutral-100 bg-neutral-50 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            <span>Version</span>
            <span>Project</span>
            <span>Channel</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {releases.map((release, i) => (
            <div
              key={release._id}
              className={cn(
                "grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-neutral-50 transition",
                i < releases.length - 1 ? "border-b border-neutral-100" : ""
              )}
            >
              <Link
                href={`/developer/projects/${release.projectId}/releases`}
                className="font-mono text-sm font-bold text-neutral-900 hover:text-blue-600 transition"
              >
                v{release.version}
              </Link>

              <div>
                <Link
                  href={`/developer/projects/${release.projectId}`}
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition"
                >
                  {release.projectName}
                </Link>
                {release.title && (
                  <p className="text-xs text-neutral-400 truncate max-w-xs">{release.title}</p>
                )}
              </div>

              <ReleaseChannelBadge channel={release.channel} size="sm" />

              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                release.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {release.status}
              </span>

              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <Clock className="h-3 w-3" />
                {new Date(release.publishedAt || release.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
