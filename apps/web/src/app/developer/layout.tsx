"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DeveloperSidebar } from "./developer-sidebar";
import { WorkspaceHeader } from "@/components/layout/workspace-header";

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard developerOnly={true}>
      <div className="flex h-full bg-[#f4f4f5]">
        <DeveloperSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <WorkspaceHeader
            kind="developer"
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
