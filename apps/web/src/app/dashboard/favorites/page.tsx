"use client";

import { Heart } from "lucide-react";

export default function FavoritesPage() {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Saved apps
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep your favorite tools close at hand.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
          0 items
        </span>
      </div>

      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <Heart className="h-6 w-6 text-slate-700" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Your collection starts here
        </h3>
        <p className="mb-5 mt-1 max-w-sm text-sm leading-6 text-slate-500">
          Save useful apps as you browse and they&apos;ll be waiting here
          whenever you need them.
        </p>
        <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          Browse Store
        </button>
      </div>
    </div>
  );
}
