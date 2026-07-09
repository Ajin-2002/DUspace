"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Menu, Home, FolderOpen, Code, Download, Heart, Star, Settings, CreditCard, LifeBuoy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "dashboard", icon: Home, label: "Dashboard", href: "/dashboard" },
  { id: "my-apps", icon: FolderOpen, label: "My Apps", count: 12, href: "/dashboard/my-apps" },
  { id: "developer-space", icon: Code, label: "Developer Space", href: "/dashboard/developer-space" },
  { id: "downloads", icon: Download, label: "Downloads", count: 3, href: "/dashboard/downloads" },
  { id: "favorites", icon: Heart, label: "Favorites", count: 24, href: "/dashboard/favorites" },
  { id: "reviews", icon: Star, label: "Reviews", count: 7, href: "/dashboard/reviews" },
  { id: "settings", icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { id: "billing", icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { id: "support", icon: LifeBuoy, label: "Support", href: "/dashboard/support" },
];

interface UserSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function UserSidebar({
  sidebarOpen,
  setSidebarOpen,
}: UserSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-lg">
              <span className="text-lg font-bold">D</span>
            </div>
            <span className="text-xl font-bold text-neutral-900">DUspace</span>
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
                      ? "bg-neutral-900 text-white shadow-lg"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-white" : "text-neutral-500"
                    )}
                  />
                  {item.label}
                  {item.count && (
                    <div
                      className={cn(
                        "ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-neutral-100 text-neutral-700"
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
          <div className="border-t border-neutral-200 px-3 py-4 space-y-3">
            {/* Developer Portal shortcut */}
            {session?.user?.isDeveloper && (
              <a
                href="/developer"
                className="flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <Code className="h-4 w-4 text-blue-600" />
                Developer Portal
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-blue-500" />
              </a>
            )}
            <div className="rounded-xl bg-neutral-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-neutral-600">Standard Plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
