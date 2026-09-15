import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { NextAuthProvider } from "@/providers/session-provider";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
  title: {
    default: "DUspace – App Marketplace",
    template: "%s | DUspace",
  },
  description:
    "Discover and download apps from developers worldwide. DUspace is your modern, cross-platform app marketplace.",
  keywords: ["app marketplace", "download apps", "developers", "DUspace"],
  openGraph: {
    title: "DUspace – App Marketplace",
    description: "Discover and download apps from developers worldwide.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="flex h-full flex-col overflow-hidden">
        <NextAuthProvider>
          <ThemeProvider>
            <Navbar />
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}