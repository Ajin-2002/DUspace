"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DeveloperSidebar } from "./developer-sidebar";

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard developerOnly={true}>
      <div className="flex h-full bg-neutral-50">
        <DeveloperSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content — only this scrolls */}
        <main className="flex flex-1 min-w-0 flex-col overflow-y-auto">
          {/* Mobile Header */}
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-4 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-bold text-white shadow">
              {session?.user?.developerProfile?.displayName?.charAt(0) || session?.user?.name?.charAt(0) || "D"}
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
