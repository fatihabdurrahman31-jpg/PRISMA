import { getPrismaUser } from '../../../lib/prisma-auth';

export async function GET(request: Request) {
  try {
    const user = await getPrismaUser(request);
    return Response.json(user ? { signedIn: true, username: user.username } : { signedIn: false }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Account lookup failed', error);
    return Response.json({ error: 'Akun belum dapat dimuat.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
