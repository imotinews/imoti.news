import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { SITE_PAUSED } from "@/lib/site-status";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLoggedIn = !!req.auth;
    const isLoginPage = pathname === "/admin/login";

    if (!isLoggedIn && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl.origin));
    }

    if (isLoggedIn && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
    }

    return NextResponse.next();
  }

  // Public site is paused while the source-licensing question gets sorted
  // out -- everything except /admin (checked above) shows a Coming Soon
  // page instead. The admin panel and database are untouched.
  if (SITE_PAUSED && pathname !== "/coming-soon") {
    return NextResponse.rewrite(new URL("/coming-soon", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
