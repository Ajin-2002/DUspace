"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Code, 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  CreditCard, 
  Settings, 
  ArrowLeft 
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "overview", icon: LayoutDashboard, label: "Overview", href: "/developer" },
  { id: "apps", icon: Package, label: "Published Apps", count: 2, href: "/developer/apps" },
  { id: "analytics", icon: BarChart3, label: "Analytics", href: "/developer/analytics" },
  { id: "earnings", icon: CreditCard, label: "Earnings", href: "/developer/earnings" },
  { id: "settings", icon: Settings, label: "Settings", href: "/developer/settings" },
];

interface DeveloperSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function DeveloperSidebar({
  sidebarOpen,
  setSidebarOpen,
}: DeveloperSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-[#0A1929] border-r border-neutral-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col text-neutral-300">
          {/* Sidebar Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-neutral-800 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Code className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">DUspace Dev</span>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {SECTIONS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-600/10 text-blue-500"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-blue-500" : "text-neutral-500 group-hover:text-neutral-400"
                    )}
                  />
                  {item.label}
                  {item.count && (
                    <div
                      className={cn(
                        "ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                        isActive
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-neutral-800 text-neutral-400"
                      )}
                    >
                      {item.count}
                    </div>
                  )}
                </Link>
              );
            })}

          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-neutral-800 px-3 py-4 space-y-3">
            {/* User Space switcher */}
            <a
              href="/dashboard"
              className="flex w-full items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800/60 px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 text-neutral-400" />
              Back to User Space
            </a>

            {/* Developer profile card */}
            <div className="rounded-xl bg-neutral-900/50 p-4 border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-500 shadow-md">
                  <Code className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.developerProfile?.displayName || session?.user?.name || "Developer"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate capitalize">
                    {session?.user?.developerStatus || "Active"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
