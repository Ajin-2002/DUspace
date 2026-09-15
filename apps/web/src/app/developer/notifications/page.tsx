"use client";

import { useState } from "react";
import { Bell, Check, Info, AlertTriangle, Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "info" | "success" | "warning" | "alert";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  read: boolean;
}

// Mock data for the UI
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Project Published",
    message: "Your project 'Awesome CLI Tool' is now live on DUspace.",
    type: "success",
    date: "1 hour ago",
    read: false,
  },
  {
    id: "n2",
    title: "New Review",
    message: "A user left a 5-star review on your project 'React Dashboard Template'.",
    type: "info",
    date: "2 hours ago",
    read: false,
  },
  {
    id: "n3",
    title: "Build Failed",
    message: "The latest build for 'Mobile App Pro' failed due to a missing dependency.",
    type: "alert",
    date: "1 day ago",
    read: true,
  },
  {
    id: "n4",
    title: "Action Required",
    message: "Please update your billing information to continue using premium features.",
    type: "warning",
    date: "2 days ago",
    read: true,
  },
];

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50" },
  success: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
  alert: { icon: Star, color: "text-red-500", bg: "bg-red-50" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Stay updated on your projects and account.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-200 mb-4">
            <Bell className="h-7 w-7 text-neutral-500" />
          </div>
          <p className="text-base font-semibold text-neutral-900">All caught up!</p>
          <p className="mt-1 text-sm text-neutral-500">You have no new notifications.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;

              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-4 p-5 transition",
                    n.read ? "bg-white" : "bg-neutral-50/50"
                  )}
                >
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.bg)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-semibold", n.read ? "text-neutral-700" : "text-neutral-900")}>
                        {n.title}
                      </p>
                      <span className="shrink-0 text-xs text-neutral-400">{n.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{n.message}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="shrink-0 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
