import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

interface AuthRequest extends NextRequest {
  auth?: {
    user: {
      id?: string;
      email: string;
      role: "youtuber" | "editor" | undefined;
      name: string;
      image: string;
    };
    expires: number;
  };
}

export async function middleware(req: AuthRequest) {
  const session = await auth();
  console.log(session);
  if (session) {
    if (!session.user.role && req.nextUrl.pathname !== "/role") {
      return NextResponse.redirect(new URL("/role", req.nextUrl));
    } else if (session.user.role) {
      const userRole = session.user.role;
      if (userRole === "youtuber" && req.nextUrl.pathname === "/dashboard") {
        return NextResponse.redirect(
          new URL("/youtube/dashboard", req.nextUrl)
        );
      }
      if (
        userRole === "editor" &&
        req.nextUrl.pathname === "/youtube/dashboard"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
      }
      if (req.nextUrl.pathname === "/") {
        return NextResponse.redirect(
          new URL(
            userRole === "editor" ? "/dashboard" : "/youtube/dashboard",
            req.nextUrl
          )
        );
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/",
    "/sign-in",
    "/api/:path*",
    "/youtube/dashboard/:path",
    "/dahsboard/:path",
  ],
};
