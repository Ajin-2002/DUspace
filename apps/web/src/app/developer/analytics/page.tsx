"use client";

import { BarChart3, TrendingUp, Users, Download } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track performance across your apps and releases.
          </p>
        </div>
        <select className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This Year</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-20 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <BarChart3 className="h-7 w-7 text-slate-700" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Not enough data yet
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Analytics will appear here once your apps start getting traffic and
          downloads.
        </p>
      </div>
    </div>
  );
}
