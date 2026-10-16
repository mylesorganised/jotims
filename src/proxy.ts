import { NextResponse, type NextRequest } from "next/server";
import { LEADER_COOKIE, SCOUT_COOKIE, verifyLeaderToken, verifyScoutToken } from "@/lib/tokens";

// Optimistic route guards. Pages and server actions re-check the session
// themselves; this just gives a clean redirect instead of a flash of content.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const leader = await verifyLeaderToken(request.cookies.get(LEADER_COOKIE)?.value);
    if (!leader) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const scout = await verifyScoutToken(request.cookies.get(SCOUT_COOKIE)?.value);
  if (!scout) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/home", "/badges/:path*", "/admin/:path*"],
};
