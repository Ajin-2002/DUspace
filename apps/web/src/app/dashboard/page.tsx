import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { UserDashboard } from "./user-dashboard";

export const metadata: Metadata = {
  title: "My Dashboard",
};

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole="user">
      <UserDashboard />
    </AuthGuard>
  );
}
