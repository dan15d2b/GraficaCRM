import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { isPublicPath } from "@/lib/auth/public-paths";
import { CABECALHO_SEM_CSS, PARAMETRO_SEM_CSS } from "@/lib/branding/sem-css-personalizado";
import {
  verifyImpersonateCookieEdge,
  IMPERSONATE_COOKIE_NAME_EDGE,
} from "@/lib/impersonate/cookie-edge";
import { getSession } from "@/lib/auth/local";
import { isSetupComplete } from "@/lib/db/local";

export async function proxy(request: NextRequest) {
  // Saída de emergência do CSS personalizado. ANTES do `NextResponse.next`: ele
  // copia os cabeçalhos da requisição no momento em que é criado, e o que for
  // posto depois não chega aos Server Components. Sempre gravado, para um
  // cabeçalho forjado pelo cliente não valer.
  request.headers.set(
    CABECALHO_SEM_CSS,
    request.nextUrl.searchParams.has(PARAMETRO_SEM_CSS) ? "1" : "0",
  );
  const response = NextResponse.next({ request: { headers: request.headers } });

  // Inject X-Request-Id for downstream correlation (audit log, error wrappers).
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  const { pathname, search } = request.nextUrl;

  // Recupera retornos de OAuth social já emitidos antes da landing pública existir.
  // Apenas a navegação é tratada: o vínculo de conta segue protegido pelos guards canônicos.
  // Passa adiante só o SINAL `connected=1` — nunca o `connect_token` nem o valor recebido.
  if (
    request.method === "GET" &&
    pathname === "/app/connections" &&
    request.nextUrl.searchParams.has("connected") &&
    request.nextUrl.searchParams.has("connect_token")
  ) {
    const landing = NextResponse.redirect(new URL("/auth/social-return?connected=1", request.url));
    landing.headers.set("Cache-Control", "no-store");
    landing.headers.set("Referrer-Policy", "no-referrer");
    return landing;
  }

  // Expose pathname to Server Components via header (used by onboarding layout).
  response.headers.set("x-pathname", pathname);
  request.headers.set("x-pathname", pathname);

  // EPIC-11: the admin surface is reached by PATH (`/admin/*`) — the self-host kit
  // points `NEXT_PUBLIC_ADMIN_URL` at the same host as the app and maps no `admin.`
  // sub-domain. The host-based branch below stays a NOOP today and only exists as
  // documentation of the intended deploy topology.
  const host = request.headers.get("host") ?? "";
  const isAdminSurface = host.startsWith("admin.") || pathname.startsWith("/admin");

  // Rotas públicas (não precisam de autenticação)
  if (isPublicPath(pathname)) {
    return response;
  }

  // ─── VERIFICAÇÃO DE SETUP INICIAL ──────────────────────────────────────────
  // Se o setup não foi completado, redireciona para /setup (exceto rotas de setup/API)
  const setupPaths = ["/setup", "/api/v1/setup"];
  const isSetupRoute = setupPaths.some((p) => pathname.startsWith(p));

  if (!isSetupRoute) {
    const setupDone = await isSetupComplete();
    if (!setupDone) {
      // API routes respondem com JSON
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({
            error: {
              code: "setup_required",
              message: "Sistema não configurado. Complete a instalação em /setup",
            },
          }),
          {
            status: 503,
            headers: {
              "content-type": "application/json",
              "x-request-id": requestId,
            },
          },
        );
      }
      // UI routes redirecionam para /setup
      const setupUrl = new URL("/setup", request.url);
      setupUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(setupUrl);
    }
  }

  // ─── AUTENTICAÇÃO LOCAL (JWT + Cookie) ────────────────────────────────────
  const session = await getSession();

  if (!session) {
    // API routes must respond with JSON envelope (contract: {error:{code,message}})
    // — never redirect HTML to JSON consumers. UI routes redirect to /login as before.
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: "unauthenticated",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: {
            "content-type": "application/json",
            "x-request-id": requestId,
          },
        },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Adiciona sessão aos headers para uso downstream
  request.headers.set("x-user-id", session.userId);
  request.headers.set("x-org-id", session.organizationId);
  request.headers.set("x-user-role", session.role);
  request.headers.set("x-user-email", session.email);
  request.headers.set("x-user-name", session.name);

  // EPIC-11 S-11.07: validate impersonate cookie on /app/* paths. Middleware
  // runs in Edge — no DB access, only HMAC + expiry. On any failure we delete
  // the presentation cookie. The database support session remains authoritative:
  // expired/revoked support still blocks the app until explicit exit.
  if (pathname.startsWith("/app")) {
    const impCookie = request.cookies.get(IMPERSONATE_COOKIE_NAME_EDGE)?.value;
    if (impCookie) {
      const result = await verifyImpersonateCookieEdge(
        impCookie,
        env.IMPERSONATE_COOKIE_SECRET ?? "",
      );
      if (!result.valid) {
        console.warn(
          `[middleware] impersonate cookie invalid (${result.reason ?? "unknown"}) — clearing`,
        );
        response.cookies.delete(IMPERSONATE_COOKIE_NAME_EDGE);
      }
    }
  }

  // /admin/* additionally requires platform_admin (early gate — authoritative
  // check is server-side in `requirePlatformAdmin`). Skip the RPC for
  // `/admin/forbidden` (rendered to non-admins, would otherwise loop).
  if (isAdminSurface && pathname.startsWith("/admin") && pathname !== "/admin/forbidden") {
    // Verifica role admin local
    if (session.role !== "dono" && session.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/forbidden", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static assets / Next internals.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};