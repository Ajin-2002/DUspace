import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DeveloperDashboard } from "./developer-dashboard";

export const metadata: Metadata = {
  title: "Developer Portal",
};

export default function DeveloperPage() {
  return (
    <AuthGuard requiredRole="developer">
      <DeveloperDashboard />
    </AuthGuard>
  );
}
