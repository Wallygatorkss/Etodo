import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  const pathname = req.nextUrl.pathname;

  // Laisse passer les assets statiques et Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(?:css|js|png|jpg|jpeg|svg|ico|webp|gif|map|woff2?|ttf|eot)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Ne pas intercepter la page de login elle-même
  if (pathname === "/login.html") {
    return NextResponse.next();
  }

  // Routes protégées du front (ajoute ici celles de l'app Next)
  // Attention: "/" ne doit pas être traité comme préfixe générique
  const isProtected = pathname === "/" || pathname.startsWith("/settings");

  // Si on accède à une route protégée sans token → redirection vers le login en HTML côté front
  if (isProtected && !token) {
    const url = new URL("/login.html", req.url); // reste sur le même host/port (3000)
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"]
};
