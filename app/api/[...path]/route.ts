// PRISMA's single account/history/Gemini backend stays on the hosted Site.
// Vercel serves the same frontend and forwards only these four API endpoints.
const BACKEND = 'https://prisma-rehearsal-fatihh.jamaahfutsalkedukan.chatgpt.site';
const endpoints = new Set(['auth', 'me', 'history', 'step']);

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path.length !== 1 || !endpoints.has(path[0])) {
    return Response.json({ error: 'Endpoint tidak ditemukan.' }, { status: 404 });
  }

  const url = new URL(request.url);
  const target = `${BACKEND}/api/${path[0]}${url.search}`;
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  if (request.method !== 'GET') {
    headers.set('content-type', 'application/json');
    // The backend checks same-origin mutations. The public browser origin is
    // validated by Vercel, then replaced with the backend's own origin.
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) {
      return Response.json({ error: 'Permintaan tidak valid.' }, { status: 403 });
    }
    headers.set('origin', BACKEND);
  }

  try {
    const body = request.method === 'GET' ? undefined : await request.text();
    if (body && body.length > 32_000) return Response.json({ error: 'Masukan terlalu panjang.' }, { status: 413 });
    const upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store', signal: AbortSignal.timeout(65_000) });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': upstream.headers.get('content-type') || 'application/json', 'X-Content-Type-Options': 'nosniff' });
    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) responseHeaders.set('set-cookie', setCookie);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: 'Layanan PRISMA sedang tidak terhubung. Coba lagi.' }, { status: 503 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 90;
export const GET = forward;
export const POST = forward;
export const DELETE = forward;
