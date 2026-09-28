import { handleStep } from '../../../lib/orchestrator.js';

export async function POST(request) {
  try {
    const raw = await request.text();
    if (!raw || raw.length > 32000) return Response.json({ error: 'Periksa masukanmu, lalu coba lagi.' }, { status: 400 });
    const result = await handleStep(JSON.parse(raw));
    return Response.json(result, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    const validation = ['short_scenario','short_fear','short_answer','bad_state','bad_round','bad_phase','bad_request','too_large'].includes(error?.message);
    return Response.json({ error: validation ? 'Periksa masukanmu, lalu coba lagi.' : 'Koneksi PRISMA sempat terputus. Coba lagi—sesi kamu tetap tersimpan.' }, { status: validation ? 400 : 503 });
  }
}
