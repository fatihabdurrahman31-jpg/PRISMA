import { getD1 } from '../db/d1';

const encoder = new TextEncoder();
// Cloudflare Workers WebCrypto supports at most 100,000 PBKDF2 iterations.
const ITERATIONS = 100_000;
const SESSION_DAYS = 14;

function base64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function fromBase64(value: string) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
function randomBytes(length: number) { return crypto.getRandomValues(new Uint8Array(length)); }

export async function passwordHash(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return base64(new Uint8Array(derived));
}

export function newSalt() { return base64(randomBytes(24)); }
export async function verifyPassword(password: string, salt: string, expected: string) {
  const actual = fromBase64(await passwordHash(password, fromBase64(salt)));
  const known = fromBase64(expected);
  if (actual.length !== known.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ known[i];
  return difference === 0;
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return base64(new Uint8Array(digest));
}

function cookieName(request: Request) { return new URL(request.url).protocol === 'https:' ? '__Host-prisma_session' : 'prisma_session'; }
function cookieValue(request: Request) {
  const name = cookieName(request);
  const cookie = request.headers.get('cookie') || '';
  return cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
}
export function sessionCookie(request: Request, token: string, maxAge: number) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${cookieName(request)}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}
export async function createSession(request: Request, userId: string) {
  const token = base64(randomBytes(32)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const now = new Date(), expires = new Date(now.getTime() + SESSION_DAYS * 86400000);
  await getD1().prepare('INSERT INTO prisma_sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)').bind(await tokenHash(token),userId,now.toISOString(),expires.toISOString()).run();
  return sessionCookie(request, token, SESSION_DAYS * 86400);
}
export async function getPrismaUser(request: Request): Promise<{ userId: string; username: string } | null> {
  const token = cookieValue(request);
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const row = await getD1().prepare('SELECT u.id AS userId, u.username AS username FROM prisma_sessions s JOIN prisma_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?').bind(await tokenHash(token),new Date().toISOString()).first<{ userId: string; username: string }>();
  return row || null;
}
export async function revokeSession(request: Request) {
  const token = cookieValue(request);
  if (token) await getD1().prepare('DELETE FROM prisma_sessions WHERE token_hash = ?').bind(await tokenHash(token)).run();
  return sessionCookie(request, '', 0);
}
export function validMutation(request: Request) {
  const origin = request.headers.get('origin');
  return request.headers.get('content-type')?.startsWith('application/json') && (!origin || origin === new URL(request.url).origin);
}
