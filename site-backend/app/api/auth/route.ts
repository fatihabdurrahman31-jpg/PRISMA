import { getD1 } from '../../../db/d1';
import { createSession, getPrismaUser, newSalt, passwordHash, revokeSession, validMutation, verifyPassword } from '../../../lib/prisma-auth';

const common = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const answer = (data: object, status = 200, cookie?: string) => Response.json(data, { status, headers: { ...common, ...(cookie ? { 'Set-Cookie': cookie } : {}) } });

export async function GET(request: Request) {
  try { const user = await getPrismaUser(request); return answer(user ? { signedIn: true, username: user.username } : { signedIn: false }); }
  catch (error) { console.error('Auth lookup failed', error); return answer({ error: 'Akun belum dapat dimuat.' }, 503); }
}

export async function POST(request: Request) {
  if (!validMutation(request)) return answer({ error: 'Permintaan tidak valid.' }, 403);
  let body: { action?: string; username?: string; password?: string };
  try { const raw = await request.text(); if (raw.length > 1000) return answer({ error: 'Masukan terlalu panjang.' }, 400); body = JSON.parse(raw); }
  catch { return answer({ error: 'Masukan tidak valid.' }, 400); }
  try {
    if (body.action === 'logout') return answer({ signedIn: false }, 200, await revokeSession(request));
    const username = (body.username || '').trim().toLowerCase(), password = body.password || '';
    if (!/^[a-z0-9_]{3,30}$/.test(username) || password.length > 128) return answer({ error: 'Nama pengguna harus 3–30 karakter (huruf, angka, atau _).' }, 400);
    const db = getD1();
    if (body.action === 'register') {
      if (password.length < 12) return answer({ error: 'Gunakan sandi minimal 12 karakter.' }, 400);
      const existing = await db.prepare('SELECT 1 FROM prisma_users WHERE username = ?').bind(username).first();
      if (existing) return answer({ error: 'Nama pengguna sudah dipakai.' }, 409);
      const salt = newSalt(), hash = await passwordHash(password, Uint8Array.from(atob(salt), c => c.charCodeAt(0))), id = crypto.randomUUID();
      try { await db.prepare('INSERT INTO prisma_users (id,username,password_salt,password_hash,created_at) VALUES (?,?,?,?,?)').bind(id,username,salt,hash,new Date().toISOString()).run(); }
      catch (error) { console.error('Registration insert failed', error); return answer({ error: 'Nama pengguna sudah dipakai atau pendaftaran gagal.' }, 409); }
      return answer({ signedIn: true, username }, 200, await createSession(request,id));
    }
    if (body.action === 'login') {
      const now = Date.now(), key = `login:${username}`, attempt = await db.prepare('SELECT count, window_start AS windowStart FROM auth_attempts WHERE key = ?').bind(key).first<{ count: number; windowStart: number }>();
      if (attempt && now - attempt.windowStart < 15 * 60000 && attempt.count >= 8) return answer({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' }, 429);
      const user = await db.prepare('SELECT id, password_salt AS salt, password_hash AS hash FROM prisma_users WHERE username = ?').bind(username).first<{ id: string; salt: string; hash: string }>();
      const valid = user ? await verifyPassword(password,user.salt,user.hash) : false;
      if (!valid) {
        const count = attempt && now - attempt.windowStart < 15 * 60000 ? attempt.count + 1 : 1;
        await db.prepare('INSERT INTO auth_attempts (key,count,window_start) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count, window_start=excluded.window_start').bind(key,count,count===1?now:attempt?.windowStart||now).run();
        return answer({ error: 'Nama pengguna atau sandi salah.' }, 401);
      }
      await db.prepare('DELETE FROM auth_attempts WHERE key = ?').bind(key).run();
      return answer({ signedIn: true, username }, 200, await createSession(request,user!.id));
    }
    return answer({ error: 'Tindakan tidak dikenal.' }, 400);
  } catch (error) { console.error('Auth request failed', error); return answer({ error: 'Akun belum dapat diproses. Coba lagi.' }, 503); }
}
