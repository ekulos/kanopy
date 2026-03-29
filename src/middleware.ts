import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");

  // ensure a default language cookie exists (lang)
  const langCookie = req.cookies.get("lang")?.value;
  const ensureLang = (res: NextResponse) => {
    if (!langCookie) {
      try {
        res.cookies.set("lang", "en", { path: "/" });
      } catch (e) {
        // best-effort: some runtimes may not allow cookies on certain responses
      }
    }
    return res;
  };

  if (isApiAuth) return ensureLang(NextResponse.next());
  if (!isLoggedIn && !isAuthPage) {
    return ensureLang(NextResponse.redirect(new URL("/login", req.nextUrl)));
  }
  if (isLoggedIn && isAuthPage) {
    return ensureLang(NextResponse.redirect(new URL("/projects", req.nextUrl)));
  }
  return ensureLang(NextResponse.next());
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)"],
};
