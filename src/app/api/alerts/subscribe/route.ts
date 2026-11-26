import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { ensureAlertSchema, getDb } from '@/lib/db';
import { alertsEnabled, escapeHtml, layout, sendEmail } from '@/lib/email';
import { SITE } from '@/lib/site';

// POST { email, name, href, lat, lon, weather, aqi, website } -> sends a confirmation email.
// Always answers with the same message, so nobody can test which addresses are subscribed.
const OK = { ok: true, message: 'Check your inbox and click the link to confirm your alerts.' };
const THRESHOLDS = [100, 150, 200];
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  if (!alertsEnabled()) return NextResponse.json({ error: 'Alerts are not switched on yet.' }, { status: 503 });
  const sql = getDb()!;
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  if (typeof b.website === 'string' && b.website) return NextResponse.json(OK); // hidden field: a bot filled it in
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) : '';
  const href = typeof b.href === 'string' ? b.href : '';
  const lat = Number(b.lat), lon = Number(b.lon);
  const weather = b.weather === true;
  const aqi = THRESHOLDS.includes(Number(b.aqi)) ? Number(b.aqi) : null;
  if (!EMAIL.test(email) || email.length > 254) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (!name || !/^\/(city\/\d+\/[a-z0-9-]+|here\?[^\s]{1,120})$/.test(href) || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Invalid place.' }, { status: 400 });
  }
  if (!weather && aqi == null) return NextResponse.json({ error: 'Choose at least one alert.' }, { status: 400 });

  await ensureAlertSchema(sql);
  await sql`delete from alert_subs where not confirmed and created_at < now() - interval '7 days'`;

  const count = (await sql`select count(*)::int as n from alert_subs where email = ${email}`) as { n: number }[];
  if ((count[0]?.n ?? 0) >= 5) return NextResponse.json({ error: 'You can have up to 5 alert places. Unsubscribe from one first.' }, { status: 400 });

  const token = randomBytes(24).toString('hex');
  const inserted = (await sql`insert into alert_subs (email, place_name, place_href, lat, lon, weather, aqi_threshold, token)
    values (${email}, ${name}, ${href}, ${lat}, ${lon}, ${weather}, ${aqi}, ${token})
    on conflict (email, place_href) do nothing returning token`) as { token: string }[];

  let send = inserted[0]?.token ?? null;
  if (!send) {
    // Already signed up: resend the confirmation if it's still pending and the last one is over 10 minutes old.
    const pending = (await sql`update alert_subs set created_at = now(), weather = ${weather}, aqi_threshold = ${aqi}
      where email = ${email} and place_href = ${href} and not confirmed and created_at < now() - interval '10 minutes'
      returning token`) as { token: string }[];
    send = pending[0]?.token ?? null;
  }
  if (!send) return NextResponse.json(OK);

  const link = `${SITE.url}/alerts/confirm?token=${send}`;
  const what = [weather ? 'rain and storms in the next 24 hours' : '', aqi ? `US AQI at ${aqi} or above` : ''].filter(Boolean).join(' and ');
  try {
    await sendEmail({
      to: email,
      subject: `Confirm your alerts for ${name}`,
      text: `Confirm your theaccuweather alerts for ${name} (${what}): ${link}\n\nIf you didn't ask for this, ignore this email and nothing will be sent.`,
      html: layout(`Confirm your alerts for ${escapeHtml(name)}`,
        `<p style="margin:0 0 16px">You asked for an email when we expect ${escapeHtml(what)}. At most one email a day.</p>
         <p style="margin:0"><a href="${link}" style="display:inline-block;background:#0a7cff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600">Confirm alerts</a></p>`,
        "If you didn't ask for this, ignore this email and nothing will be sent."),
    });
  } catch (err) {
    console.error('Confirmation email failed', err);
    return NextResponse.json({ error: 'We could not send the email right now. Please try again later.' }, { status: 502 });
  }
  return NextResponse.json(OK);
}
