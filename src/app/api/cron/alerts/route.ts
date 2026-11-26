import { NextResponse } from 'next/server';
import { ensureAlertSchema, getDb } from '@/lib/db';
import { escapeHtml, layout, sendEmail } from '@/lib/email';
import { hourIndex, localNow } from '@/lib/api/client';
import { categorize } from '@/lib/aqi';
import { SITE } from '@/lib/site';

// Checks confirmed sign-ups and emails anyone whose place expects rain/storms in the next
// 24 hours or whose US AQI is at or above their limit. At most one email per person per place
// a day. Called every 3 hours by .github/workflows/collect.yml, protected by CRON_SECRET.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 50;
const MAX_EMAILS = 80; // stay under the email provider's free daily limit

type Sub = { id: number; email: string; place_name: string; place_href: string; lat: number; lon: number; weather: boolean; aqi_threshold: number | null; token: string };
type Loc = { utc_offset_seconds?: number; current?: { us_aqi?: number }; hourly?: { time?: string[]; precipitation_probability?: (number | null)[]; weather_code?: (number | null)[] } };

async function fetchList(url: string): Promise<Loc[]> {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
  const d: unknown = await res.json();
  return (Array.isArray(d) ? d : [d]) as Loc[];
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sql = getDb();
  if (!sql || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, skipped: 'Alerts are not switched on' });

  await ensureAlertSchema(sql);
  await sql`delete from alert_subs where not confirmed and created_at < now() - interval '7 days'`;
  const subs = (await sql`select id, email, place_name, place_href, lat, lon, weather, aqi_threshold, token from alert_subs
    where confirmed and (last_sent_at is null or last_sent_at < now() - interval '20 hours')
    order by last_sent_at nulls first limit 500`) as Sub[];

  // One reading per place (rounded to ~1 km), shared by everyone who follows it.
  const key = (s: Sub) => `${s.lat.toFixed(2)},${s.lon.toFixed(2)}`;
  const places = [...new Map(subs.map((s) => [key(s), { lat: Number(s.lat.toFixed(2)), lon: Number(s.lon.toFixed(2)) }])).entries()];
  const readings = new Map<string, { aqi: number | null; pop: number; storm: boolean }>();
  for (let i = 0; i < places.length; i += BATCH) {
    const batch = places.slice(i, i + BATCH);
    const loc = `latitude=${batch.map(([, p]) => p.lat).join(',')}&longitude=${batch.map(([, p]) => p.lon).join(',')}`;
    try {
      const [aq, wx] = await Promise.all([
        fetchList(`https://air-quality-api.open-meteo.com/v1/air-quality?${loc}&current=us_aqi`),
        fetchList(`https://api.open-meteo.com/v1/forecast?${loc}&hourly=precipitation_probability,weather_code&forecast_days=2&timezone=auto`),
      ]);
      batch.forEach(([k], j) => {
        const h = wx[j]?.hourly;
        const times = h?.time ?? [];
        const start = hourIndex(times, localNow(wx[j]?.utc_offset_seconds ?? 0));
        const pops = (h?.precipitation_probability ?? []).slice(start, start + 24).filter((v): v is number => typeof v === 'number');
        const codes = (h?.weather_code ?? []).slice(start, start + 24);
        const a = aq[j]?.current?.us_aqi;
        readings.set(k, { aqi: typeof a === 'number' ? Math.round(a) : null, pop: pops.length ? Math.max(...pops) : 0, storm: codes.some((c) => typeof c === 'number' && c >= 95) });
      });
    } catch (err) {
      console.error('Alert batch failed', err);
    }
  }

  let sent = 0, failed = 0;
  for (const s of subs) {
    if (sent >= MAX_EMAILS) break;
    const r = readings.get(key(s));
    if (!r) continue;
    const lines: string[] = [];
    if (s.weather && r.storm) lines.push('Thunderstorms are expected in the next 24 hours.');
    else if (s.weather && r.pop >= 70) lines.push(`Rain is likely in the next 24 hours (up to ${r.pop}% chance).`);
    const cat = categorize('us', r.aqi);
    if (s.aqi_threshold != null && r.aqi != null && r.aqi >= s.aqi_threshold) lines.push(`Air quality is ${cat?.label.toLowerCase() ?? 'poor'}: US AQI ${r.aqi}.`);
    if (lines.length === 0) continue;

    const page = `${SITE.url}${s.place_href}`;
    const unsub = `${SITE.url}/alerts/unsubscribe?token=${s.token}`;
    const subject = r.storm && s.weather ? `Storm alert for ${s.place_name}` : lines[0].startsWith('Rain') ? `Rain alert for ${s.place_name}` : `Air quality alert for ${s.place_name}`;
    try {
      await sendEmail({
        to: s.email,
        subject,
        text: `${lines.join('\n')}\n\nForecast: ${page}\n\nUnsubscribe: ${unsub}`,
        html: layout(escapeHtml(subject),
          `${lines.map((l) => `<p style="margin:0 0 10px">${escapeHtml(l)}</p>`).join('')}
           <p style="margin:16px 0 0"><a href="${page}" style="display:inline-block;background:#0a7cff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:600">See the forecast</a></p>`,
          `You get this because you asked for alerts for ${escapeHtml(s.place_name)}. <a href="${unsub}" style="color:#0a7cff">Unsubscribe</a>`),
        headers: { 'List-Unsubscribe': `<${SITE.url}/api/alerts/unsubscribe?token=${s.token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
      await sql`update alert_subs set last_sent_at = now() where id = ${s.id}`;
      sent++;
    } catch (err) {
      failed++;
      console.error('Alert email failed', err);
    }
  }
  return NextResponse.json({ ok: failed === 0, checked: subs.length, places: places.length, sent, failed });
}
