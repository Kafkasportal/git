import { NextRequest, NextResponse } from 'next/server';
import { getCsrfTokenHeader, validateCsrfToken } from '@/lib/csrf';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api')) {
    const method = request.method.toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      const headerName = getCsrfTokenHeader();
      const headerToken = request.headers.get(headerName) || '';
      const cookieToken = request.cookies.get('csrf-token')?.value || '';
      if (!validateCsrfToken(headerToken, cookieToken)) {
        return new NextResponse(
          JSON.stringify({ success: false, error: 'CSRF doğrulaması başarısız', code: 'INVALID_CSRF' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
