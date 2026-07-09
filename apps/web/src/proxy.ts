import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Normal users shouldn't access developer pages unless they upgrade
    if (pathname.startsWith("/developer") && token?.role === "user") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Notice we removed the redirect that forced developers away from /dashboard.
    // Since accounts are unified, developers are allowed to view the normal user dashboard.

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run the middleware function if the user is authorized
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/developer/:path*", "/settings/:path*"],
};
