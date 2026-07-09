"use client";

import { Plus, HelpCircle, Book, MessageSquare, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Help & Support</h2>
        <button className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Quick Help */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "FAQ", icon: HelpCircle, color: "bg-neutral-100 text-neutral-700" },
          { label: "Documentation", icon: Book, color: "bg-neutral-100 text-neutral-700" },
          { label: "Contact Us", icon: MessageSquare, color: "bg-neutral-100 text-neutral-700" },
        ].map((item) => (
          <button
            key={item.label}
            className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md"
          >
            <div className={cn("rounded-full p-3", item.color)}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className="font-medium text-neutral-900">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Support Tickets */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-neutral-900">My Tickets</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-neutral-200 border-dashed bg-neutral-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm mb-3">
            <LifeBuoy className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-900">No active tickets</p>
          <p className="text-xs text-neutral-500 mt-1">You don't have any open support tickets.</p>
        </div>
      </div>
    </div>
  );
}
