"use client";

import { Download } from "lucide-react";

export default function DownloadsPage() {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Downloads
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your active and completed downloads.
          </p>
        </div>
        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
          Clear History
        </button>
      </div>

      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <Download className="h-6 w-6 text-slate-700" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          No active downloads
        </h3>
        <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
          Your download history will appear here when you get an app from the
          marketplace.
        </p>
      </div>
    </div>
  );
}
