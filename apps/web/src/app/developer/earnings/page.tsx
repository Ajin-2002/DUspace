"use client";

import { CreditCard, DollarSign, ArrowUpRight } from "lucide-react";

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Earnings & Payouts</h1>
          <p className="mt-1 text-sm text-neutral-400">Manage your revenue, bank accounts, and payout history.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200">
          <ArrowUpRight className="h-4 w-4" />
          Request Payout
        </button>
      </div>

      {/* Balance Card */}
      <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white shadow-xl">
        <p className="text-sm font-medium text-blue-200">Available Balance</p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight">$0.00</h2>
        <div className="mt-6 flex items-center gap-4 border-t border-blue-500/30 pt-6">
          <div>
            <p className="text-xs text-blue-200">Pending</p>
            <p className="text-lg font-semibold">$0.00</p>
          </div>
          <div className="h-8 w-px bg-blue-500/30"></div>
          <div>
            <p className="text-xs text-blue-200">Last Payout</p>
            <p className="text-lg font-semibold">$0.00</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-medium text-white">Payout History</h3>
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 border-dashed bg-neutral-900/20 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 mb-4">
            <CreditCard className="h-6 w-6 text-neutral-500" />
          </div>
          <p className="text-sm font-medium text-white">No payout history</p>
          <p className="text-xs text-neutral-400 mt-1">Your past earnings and transfers will appear here.</p>
        </div>
      </div>
    </div>
  );
}
