"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  Code2,
  Download,
  Heart,
  Star,
  Settings,
  CreditCard,
  LifeBuoy,
  ExternalLink,
  User,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { id: "dashboard", icon: Home, label: "Dashboard", href: "/dashboard" },
      { id: "my-apps", icon: FolderOpen, label: "My Apps", count: 12, href: "/dashboard/my-apps" },
      { id: "downloads", icon: Download, label: "Downloads", count: 3, href: "/dashboard/downloads" },
      { id: "favorites", icon: Heart, label: "Favourites", count: 24, href: "/dashboard/favorites" },
      { id: "reviews", icon: Star, label: "Reviews", count: 7, href: "/dashboard/reviews" },
    ],
  },
  {
    label: "Developer",
    items: [
      { id: "developer-space", icon: Code2, label: "Developer Space", href: "/dashboard/developer-space" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "settings", icon: Settings, label: "Settings", href: "/dashboard/settings" },
      { id: "billing", icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
      { id: "support", icon: LifeBuoy, label: "Support", href: "/dashboard/support" },
    ],
  },
];

interface UserSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function UserSidebar({ sidebarOpen, setSidebarOpen }: UserSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userName = session?.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = session?.user?.email || "";

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] shrink-0 flex-col",
          "bg-white border-r border-neutral-100",
          "transition-transform duration-300 ease-in-out",
          "lg:static lg:h-full lg:translate-x-0 lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Logo ─────────────────────────────────────────── */}
        <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-neutral-100 px-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-[13px] font-semibold text-neutral-900 tracking-tight">User Space</span>
            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">Workspace</span>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[15px] w-[15px] shrink-0 transition-colors",
                          isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-600"
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.count && (
                        <span
                          className={cn(
                            "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-neutral-100 text-neutral-500"
                          )}
                        >
                          {item.count}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="h-3 w-3 text-white/50 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="shrink-0 border-t border-neutral-100 px-3 py-3 space-y-1.5">
          {/* Developer Portal shortcut */}
          {session?.user?.isDeveloper && (
            <a
              href="/developer"
              className="flex items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-2 text-[13px] font-medium text-blue-700 transition hover:bg-blue-100"
            >
              <Code2 className="h-[15px] w-[15px] text-blue-500 shrink-0" />
              <span className="flex-1">Developer Portal</span>
              <ExternalLink className="h-3 w-3 text-blue-400 shrink-0" />
            </a>
          )}

          {/* User profile card */}
          <div className="flex items-center gap-2.5 rounded-lg bg-neutral-50 border border-neutral-100 px-2.5 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white text-[12px] font-bold shadow-sm">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-900 leading-none mb-0.5">
                {userName}
              </p>
              <p className="truncate text-[10px] text-neutral-400">
                {userEmail || "Standard Plan"}
              </p>
            </div>
            <User className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
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
