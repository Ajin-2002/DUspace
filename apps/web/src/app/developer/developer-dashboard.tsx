"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Container from "@/components/layout/container";

const MOCK_APPS = [
  {
    name: "TaskMaster Pro",
    status: "Published",
    installs: "12,400",
    rating: 4.7,
    revenue: "$1,240",
    icon: "📋",
  },
  {
    name: "WeatherNow",
    status: "In Review",
    installs: "—",
    rating: 0,
    revenue: "—",
    icon: "🌤️",
  },
];

const DEV_STATS = [
  { label: "Total Apps", value: "2", icon: "📦" },
  { label: "Total Installs", value: "12.4K", icon: "⬇️" },
  { label: "Avg Rating", value: "4.7", icon: "⭐" },
  { label: "Revenue", value: "$1,240", icon: "💰" },
];

export function DeveloperDashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen py-10">
      <Container>
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={session?.user?.image}
              name={session?.user?.name}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session?.user?.name ?? "Developer Portal"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.email}
              </p>
              <Badge variant="developer" className="mt-1.5">
                🚀 Developer
              </Badge>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-[#0F3B5C] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a5a7a]">
              <span>+</span> Submit App
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DEV_STATS.map((stat) => (
            <div
              key={stat.label}
              className="card-surface flex flex-col items-center gap-2 p-5 text-center"
            >
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Apps table */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            Your Apps
          </h2>
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-white/10 dark:bg-white/5">
                  <tr>
                    {["App", "Status", "Installs", "Rating", "Revenue"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left font-semibold text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {MOCK_APPS.map((app) => (
                    <tr
                      key={app.name}
                      className="transition hover:bg-gray-50/50 dark:hover:bg-white/5"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{app.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {app.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            app.status === "Published" ? "success" : "warning"
                          }
                        >
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                        {app.installs}
                      </td>
                      <td className="px-5 py-4">
                        {app.rating > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="text-amber-400">★</span>
                            {app.rating}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium text-emerald-600 dark:text-emerald-400">
                        {app.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upload CTA */}
        <Card className="flex flex-col items-center gap-4 bg-gradient-to-br from-violet-50 to-blue-50 py-10 text-center dark:from-violet-950/30 dark:to-blue-950/30">
          <span className="text-4xl">🚀</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Ready to ship your next app?
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Submit a new app to reach millions of users on DUspace.
            </p>
          </div>
          <button className="rounded-xl bg-[#0F3B5C] px-6 py-3 font-semibold text-white shadow-md transition hover:bg-[#1a5a7a]">
            Submit New App
          </button>
        </Card>
      </Container>
    </div>
  );
}
