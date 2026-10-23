"use client";

import { Plus, HelpCircle, Book, MessageSquare, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Help & support
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Find answers or get help from our team.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Quick Help */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "FAQ",
            icon: HelpCircle,
            color: "bg-slate-100 text-slate-700",
          },
          {
            label: "Documentation",
            icon: Book,
            color: "bg-slate-100 text-slate-700",
          },
          {
            label: "Contact Us",
            icon: MessageSquare,
            color: "bg-slate-100 text-slate-700",
          },
        ].map((item) => (
          <button
            key={item.label}
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-[0_5px_20px_-15px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className={cn("rounded-2xl p-3", item.color)}>
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Support Tickets */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          My tickets
        </h3>
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <LifeBuoy className="h-5 w-5 text-slate-700" />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            No active tickets
          </p>
          <p className="mt-1 text-sm text-slate-500">
            You don&apos;t have any open support tickets.
          </p>
        </div>
      </div>
    </div>
  );
}
