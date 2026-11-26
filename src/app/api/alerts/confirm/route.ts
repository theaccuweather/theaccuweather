import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST { token } -> confirms a sign-up (called by the button on /alerts/confirm).
export async function POST(req: Request) {
  const sql = getDb();
  if (!sql) return NextResponse.json({ error: 'Alerts are not switched on yet.' }, { status: 503 });
  const { token } = (await req.json().catch(() => ({}))) as { token?: unknown };
  if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 });
  const rows = (await sql`update alert_subs set confirmed = true where token = ${token} returning place_name`) as { place_name: string }[];
  if (!rows[0]) return NextResponse.json({ error: 'This link has expired or was already used to unsubscribe.' }, { status: 404 });
  return NextResponse.json({ ok: true, place: rows[0].place_name });
}
