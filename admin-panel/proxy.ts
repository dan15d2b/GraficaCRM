import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware do Admin Panel VPS
// Protege rotas de admin e valida sessão de platform admin

const ADMIN_PATHS = ['/dashboard', '/licenses', '/clients', '/settings'];
const PUBLIC_PATHS = ['/api/license/validate', '/api/admin/setup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verificar se é rota de admin
  const isAdminRoute = ADMIN_PATHS.some(p => pathname.startsWith(p));
  
  if (isAdminRoute) {
    // TODO: Implementar verificação de sessão admin
    // Por enquanto, permitir acesso (setup inicial cria o admin)
    const sessionCookie = request.cookies.get('admin_session');
    
    if (!sessionCookie && pathname !== '/') {
      // Redirecionar para login/setup se não tem sessão
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Headers de segurança
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};