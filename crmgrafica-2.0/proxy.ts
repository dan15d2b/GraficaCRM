import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  response.headers.set('x-request-id', requestId);
  return response;
}
