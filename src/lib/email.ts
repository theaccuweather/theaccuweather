// Sends email through Resend's HTTP API (no extra package). Needs RESEND_API_KEY and a domain
// verified in Resend. ALERT_FROM is the sender, e.g. "theaccuweather <alerts@theaccuweather.com>".
export const alertsEnabled = () => Boolean(process.env.RESEND_API_KEY && (process.env.DATABASE_URL ?? process.env.POSTGRES_URL));

type Mail = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };

export async function sendEmail(m: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ALERT_FROM ?? 'theaccuweather <alerts@theaccuweather.com>',
      to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Resend returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A simple, readable email layout. `body` is trusted HTML built by our own code. */
export function layout(title: string, body: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2633">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px">
    <p style="margin:0 0 16px;font-weight:600;font-size:18px">theaccu<span style="color:#0a7cff">weather</span></p>
    <div style="background:#fff;border:1px solid #e3e7ef;border-radius:14px;padding:20px">
      <h1 style="margin:0 0 12px;font-size:20px">${title}</h1>${body}
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5b6475">${footer}</p>
  </div></body></html>`;
}
