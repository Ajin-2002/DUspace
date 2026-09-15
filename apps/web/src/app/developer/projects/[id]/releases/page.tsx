"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Tag, Clock, Loader2, Package } from "lucide-react";
import { ReleaseChannelBadge } from "@/components/developer/release-channel-badge";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

interface Release {
  _id: string;
  version: string;
  title?: string;
  releaseNotes?: string;
  channel: "alpha" | "beta" | "stable";
  status: "draft" | "published";
  files: { size: number }[];
  createdAt: string;
  publishedAt?: string;
}

export default function ReleasesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.token) return;
    fetch(getApiUrl(`/api/developer/apps/${id}/releases`), {
      headers: { Authorization: `Bearer ${session.user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { setReleases(d.releases || []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [session, id]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Releases</h2>
          <p className="mt-0.5 text-sm text-neutral-500">Manage all versions of this project.</p>
        </div>
        <Link
          href={`/developer/projects/${id}/releases/new`}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 transition"
        >
          <Plus className="h-4 w-4" />
          Create release
        </Link>
      </div>

      {releases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 mb-4">
            <Package className="h-7 w-7 text-neutral-500" />
          </div>
          <p className="text-base font-semibold text-neutral-900">No releases yet</p>
          <p className="mt-1 text-sm text-neutral-500 mb-6">Create your first release to publish this project.</p>
          <Link
            href={`/developer/projects/${id}/releases/new`}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition"
          >
            <Plus className="h-4 w-4" /> Create first release
          </Link>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-100" />

          <div className="space-y-4">
            {releases.map((release) => (
              <div key={release._id} className="relative flex gap-5">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  release.status === "published"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-neutral-200 bg-white text-neutral-500"
                )}>
                  <Tag className="h-4 w-4" />
                </div>

                {/* Card */}
                <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-neutral-900">
                          v{release.version}
                        </span>
                        {release.title && (
                          <span className="text-sm text-neutral-600">{release.title}</span>
                        )}
                        <ReleaseChannelBadge channel={release.channel} size="sm" />
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          release.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        )}>
                          {release.status}
                        </span>
                      </div>
                      {release.releaseNotes && (
                        <p className="text-xs text-neutral-500 line-clamp-2">{release.releaseNotes}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {release.publishedAt
                            ? `Published ${new Date(release.publishedAt).toLocaleDateString()}`
                            : `Created ${new Date(release.createdAt).toLocaleDateString()}`}
                        </span>
                        <span>{release.files.length} file{release.files.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {release.status === "draft" && (
                        <Link
                          href={`/developer/projects/${id}/releases/${release._id}/publish`}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          Publish
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
