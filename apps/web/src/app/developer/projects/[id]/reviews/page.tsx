"use client";

import { MessageSquare, Star } from "lucide-react";

export default function ProjectReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-neutral-900">Reviews</h2>
        <p className="mt-0.5 text-sm text-neutral-500">User feedback and ratings for this project.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "Average Rating", value: "—", icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: "Total Reviews", value: "0", icon: MessageSquare, color: "bg-blue-50 text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-neutral-200 bg-white p-5 flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{value}</p>
              <p className="text-sm text-neutral-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
        <MessageSquare className="mb-3 h-10 w-10 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-700">No reviews yet</p>
        <p className="mt-1 text-xs text-neutral-400">Reviews will appear here after users interact with your project.</p>
      </div>
    </div>
  );
}
