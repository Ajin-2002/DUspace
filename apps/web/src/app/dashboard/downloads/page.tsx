"use client";

import { Download } from "lucide-react";

export default function DownloadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Downloads</h2>
          <p className="text-sm text-neutral-500">Manage your active and completed downloads.</p>
        </div>
        <button className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200">
          Clear History
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 border-dashed bg-neutral-50 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm mb-4">
          <Download className="h-6 w-6 text-neutral-400" />
        </div>
        <h3 className="text-sm font-medium text-neutral-900">No active downloads</h3>
        <p className="text-xs text-neutral-500 mt-1">Your download history will appear here.</p>
      </div>
    </div>
  );
}
