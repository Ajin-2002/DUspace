"use client";

import { BarChart3, TrendingUp, Users, Download } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-neutral-400">Track performance metrics across all your apps.</p>
        </div>
        <select className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm font-medium text-neutral-300 focus:border-blue-500 focus:outline-none">
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>This Year</option>
          <option>All Time</option>
        </select>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 border-dashed bg-neutral-900/20 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 mb-5">
          <BarChart3 className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-white">Not enough data</h3>
        <p className="text-sm text-neutral-400 mt-2 max-w-sm">
          Analytics will appear here once your apps start getting traffic and downloads.
        </p>
      </div>
    </div>
  );
}
