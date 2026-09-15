"use client";

import { BarChart2, TrendingUp, Eye, Download } from "lucide-react";

export default function ProjectAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-neutral-900">Analytics</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Track views, downloads, and engagement for this project.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Views", value: "—", icon: Eye, color: "bg-blue-50 text-blue-600" },
          { label: "Total Downloads", value: "—", icon: Download, color: "bg-emerald-50 text-emerald-600" },
          { label: "Growth Rate", value: "—", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
        <BarChart2 className="mb-3 h-10 w-10 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">Analytics coming soon</p>
        <p className="mt-1 text-xs text-neutral-400">Publish a release to start tracking engagement metrics.</p>
      </div>
    </div>
  );
}
