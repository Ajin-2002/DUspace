"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { UserSidebar } from "./user-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-neutral-50">
        <UserSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden p-6">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Header */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white shadow-md">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
              </div>
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
