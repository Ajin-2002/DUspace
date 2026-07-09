"use client";

import { useSession } from "next-auth/react";
import { Download, Star, DollarSign, Users, Activity, TrendingUp } from "lucide-react";

export default function DeveloperDashboardOverview() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {session?.user?.developerProfile?.displayName || session?.user?.name || "Developer"}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Here's what's happening with your applications today.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Publish New App
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Installs", value: "0", change: "+0% from last month", icon: Download, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active Users", value: "0", change: "0 unique this week", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Revenue", value: "$0.00", change: "+$0.00 this week", icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Avg. Rating", value: "0.0", change: "0 total reviews", icon: Star, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
                <TrendingUp className="h-3 w-3" />
                0%
              </span>
            </div>
            <div className="mt-4">
              <span className="text-sm font-medium text-neutral-400">{stat.label}</span>
              <span className="mt-1 block text-2xl font-bold text-white">{stat.value}</span>
              <span className="mt-1 block text-xs text-neutral-500">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <button className="text-sm font-medium text-blue-500 hover:text-blue-400">View All</button>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800 mb-4">
              <Activity className="h-8 w-8 text-neutral-500" />
            </div>
            <p className="text-base font-medium text-white">No recent activity</p>
            <p className="text-sm text-neutral-400 mt-1">Publish an app to see your metrics here.</p>
          </div>
        </div>

        {/* Popular Apps */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Top Apps</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-neutral-400">You haven't published any apps yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
