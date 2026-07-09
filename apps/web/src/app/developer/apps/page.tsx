"use client";

import { Package, Plus, Filter, Search } from "lucide-react";

export default function PublishedAppsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Published Apps</h1>
          <p className="mt-1 text-sm text-neutral-400">Manage your published applications and updates.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Create New App
        </button>
      </div>

      {/* Filters/Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search your apps..." 
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 border-dashed bg-neutral-900/20 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 mb-5">
          <Package className="h-8 w-8 text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-white">No published apps</h3>
        <p className="text-sm text-neutral-400 mt-2 mb-6 max-w-sm">
          You haven't published any applications yet. Create your first app to get started.
        </p>
        <button className="flex items-center gap-2 rounded-xl bg-white text-neutral-950 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-200">
          <Plus className="h-4 w-4" />
          Create New App
        </button>
      </div>
    </div>
  );
}
