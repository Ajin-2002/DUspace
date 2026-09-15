"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  LayoutDashboard,
  Package,
  Tag,
  BarChart3,
  User,
  Bell,
  ArrowLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "Overview",
    items: [
      { id: "overview", icon: LayoutDashboard, label: "Overview", href: "/developer" },
    ],
  },
  {
    label: "Projects",
    items: [
      { id: "projects", icon: Package, label: "My Projects", href: "/developer/projects" },
      { id: "releases", icon: Tag, label: "All Releases", href: "/developer/releases" },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "analytics", icon: BarChart3, label: "Analytics", href: "/developer/analytics" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "profile", icon: User, label: "Profile", href: "/developer/profile" },
      { id: "notifications", icon: Bell, label: "Notifications", href: "/developer/notifications" },
    ],
  },
];

interface DeveloperSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function DeveloperSidebar({ sidebarOpen, setSidebarOpen }: DeveloperSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const displayName =
    session?.user?.developerProfile?.displayName || session?.user?.name || "Developer";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-[13px] font-semibold text-neutral-900 tracking-tight">Dev Portal</span>
            <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">Workspace</span>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/developer"
                      ? pathname === "/developer"
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
          {/* Back to User Space */}
          <a
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-[13px] font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ArrowLeft className="h-[15px] w-[15px] text-neutral-400 shrink-0" />
            <span className="flex-1">Back to User Space</span>
          </a>

          {/* Developer profile card */}
          <Link
            href="/developer/profile"
            className="flex items-center gap-2.5 rounded-lg bg-neutral-50 border border-neutral-100 px-2.5 py-2.5 transition hover:bg-neutral-100"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-[12px] font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-900 leading-none mb-0.5">
                {displayName}
              </p>
              <p className="text-[10px] text-neutral-400 capitalize">
                {session?.user?.developerStatus || "Developer"}
              </p>
            </div>
            <Zap className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
