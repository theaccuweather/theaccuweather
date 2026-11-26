import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST with { token } or ?token=… -> deletes the sign-up. The query form supports one-click
// unsubscribe from email apps (List-Unsubscribe-Post).
export async function POST(req: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ error: 'Alerts are not switched on.' }, { status: 503 });
  let token = new URL(req.url).searchParams.get('token');
  if (!token) token = ((await req.json().catch(() => ({}))) as { token?: string }).token ?? null;
  if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 });
  await sql`delete from alert_subs where token = ${token}`;
  return NextResponse.json({ ok: true });
}
