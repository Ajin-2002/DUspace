"use client";

import Container from "./container";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isWorkspace =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/developer" ||
    pathname.startsWith("/developer/");

  if (isWorkspace) return null;

  return (
    <footer className="border-t mt-20">
      <Container className="py-10 text-sm text-gray-600">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <h2 className="font-bold text-[#0F3B5C] text-lg">DUspace</h2>
            <p className="mt-2 max-w-sm">
              A modern platform to discover and download applications across all
              platforms.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <h3 className="font-semibold">Platform</h3>
              <ul className="mt-2 space-y-1">
                <li>Apps</li>
                <li>Developers</li>
                <li>Categories</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Support</h3>
              <ul className="mt-2 space-y-1">
                <li>Help</li>
                <li>Contact</li>
                <li>Privacy</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-4 text-center text-xs">
          © {new Date().getFullYear()} DUspace. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
