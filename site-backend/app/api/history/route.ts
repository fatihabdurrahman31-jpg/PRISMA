import { getPrismaUser, validMutation } from '../../../lib/prisma-auth';
import { getD1 } from '../../../db/d1';

const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const clamp = (value: unknown) => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 10;
const short = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export async function GET(request: Request) {
  const user = await getPrismaUser(request);
  if (!user) return Response.json({ error: 'Masuk ke akun PRISMA untuk melihat riwayat.' }, { status: 401, headers });
  try {
    const db = getD1(), localNow = new Date(Date.now() + 7 * 3600000), year = localNow.getUTCFullYear(), month = localNow.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1) - 7 * 3600000).toISOString(), end = new Date(Date.UTC(year, month + 1, 1) - 7 * 3600000).toISOString();
    const [result, summary] = await Promise.all([
      db.prepare('SELECT id, created_at AS createdAt, updated_at AS updatedAt, title, scenario, fear, action, tension_before AS tensionBefore, predicted_impact AS predictedImpact, readiness_before AS readinessBefore, readiness_after AS readinessAfter, outcome, impact FROM rehearsals WHERE user_id = ? ORDER BY created_at DESC LIMIT 200').bind(user.userId).all(),
      db.prepare('SELECT COUNT(*) AS count, ROUND(AVG(readiness_before),1) AS readinessBefore, ROUND(AVG(readiness_after),1) AS readinessAfter, SUM(CASE WHEN outcome IS NOT NULL THEN 1 ELSE 0 END) AS realityChecks FROM rehearsals WHERE user_id = ? AND created_at >= ? AND created_at < ?').bind(user.userId,start,end).first(),
    ]);
    return Response.json({ records: result.results, summary }, { headers });
  } catch (error) {
    console.error('History read failed', error);
    return Response.json({ error: 'Riwayat belum dapat dimuat. Coba lagi.' }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  if (!validMutation(request)) return Response.json({ error: 'Permintaan tidak valid.' }, { status: 403, headers });
  const user = await getPrismaUser(request);
  if (!user) return Response.json({ error: 'Masuk ke akun PRISMA untuk menyimpan sesi.' }, { status: 401, headers });
  try {
    const raw = await request.text();
    if (raw.length > 5000) return Response.json({ error: 'Data sesi terlalu panjang.' }, { status: 400, headers });
    const body = JSON.parse(raw);
    const db = getD1();
    if (body.stage === 'action') {
      if (!(short(body.title, 100) && short(body.scenario, 1200) && short(body.fear, 250) && short(body.action, 300) && clamp(body.tensionBefore) && clamp(body.predictedImpact) && clamp(body.readinessBefore) && clamp(body.readinessAfter))) return Response.json({ error: 'Data sesi tidak lengkap.' }, { status: 400, headers });
      const id = crypto.randomUUID(), now = new Date().toISOString();
      await db.prepare('INSERT INTO rehearsals (id,user_id,created_at,updated_at,title,scenario,fear,action,tension_before,predicted_impact,readiness_before,readiness_after) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user.userId,now,now,body.title.trim(),body.scenario.trim(),body.fear.trim(),body.action.trim(),body.tensionBefore,body.predictedImpact,body.readinessBefore,body.readinessAfter).run();
      return Response.json({ id }, { headers });
    }
    if (body.stage === 'reality') {
      if (!(typeof body.id === 'string' && /^[0-9a-f-]{36}$/.test(body.id) && short(body.outcome,800) && clamp(body.impact))) return Response.json({ error: 'Data hasil tidak lengkap.' }, { status: 400, headers });
      const result = await db.prepare('UPDATE rehearsals SET outcome = ?, impact = ?, updated_at = ? WHERE id = ? AND user_id = ?').bind(body.outcome.trim(),body.impact,new Date().toISOString(),body.id,user.userId).run();
      if (!result.meta.changes) return Response.json({ error: 'Sesi tidak ditemukan.' }, { status: 404, headers });
      return Response.json({ saved: true }, { headers });
    }
    return Response.json({ error: 'Tahap tidak dikenal.' }, { status: 400, headers });
  } catch (error) {
    console.error('History write failed', error);
    return Response.json({ error: 'Sesi belum tersimpan. Coba lagi.' }, { status: 503, headers });
  }
}

export async function DELETE(request: Request) {
  if (!validMutation(request)) return Response.json({ error: 'Permintaan tidak valid.' }, { status: 403, headers });
  const user = await getPrismaUser(request);
  if (!user) return Response.json({ error: 'Masuk untuk menghapus riwayat.' }, { status: 401, headers });
  try {
    const body = await request.json() as { id?: unknown };
    if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/.test(body.id)) return Response.json({ error: 'ID tidak valid.' }, { status: 400, headers });
    await getD1().prepare('DELETE FROM rehearsals WHERE id = ? AND user_id = ?').bind(body.id,user.userId).run();
    return Response.json({ deleted: true }, { headers });
  } catch (error) {
    console.error('History delete failed', error);
    return Response.json({ error: 'Sesi belum terhapus. Coba lagi.' }, { status: 503, headers });
  }
}
