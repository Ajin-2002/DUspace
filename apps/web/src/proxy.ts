import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Role-based redirect: developer hitting /dashboard → send to /developer
    if (pathname.startsWith("/dashboard") && token?.role === "developer") {
      return NextResponse.redirect(new URL("/developer", req.url));
    }

    // Role-based redirect: user hitting /developer → send to /dashboard
    if (pathname.startsWith("/developer") && token?.role === "user") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

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
