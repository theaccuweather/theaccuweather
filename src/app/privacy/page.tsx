import type { Metadata } from 'next';
import Section from '@/components/Section';

export const metadata: Metadata = { title: 'Privacy', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Privacy</h1>
      <Section title="What we collect">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li><b>Browsing the site:</b> no account and no tracking cookies. Your browser remembers your chosen AQI standard, light or dark theme, and saved places on your own device.</li>
          <li><b>Your location:</b> our host (Vercel) tells us your approximate city from your IP address so we can show local weather. We don’t store it. “Locate me” uses your browser’s location only when you allow it, and only to open the forecast.</li>
          <li><b>Email alerts:</b> if you sign up, we store your email address, the place, your alert choices and when we last emailed you.</li>
        </ul>
      </Section>
      <Section title="How alerts work">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>Nothing is sent until you click the confirmation link. Unconfirmed sign-ups are deleted after 7 days.</li>
          <li>Emails are sent through Resend. We never sell or share your email address.</li>
          <li>Every email has an unsubscribe link. Unsubscribing deletes your email address and choices straight away.</li>
        </ul>
      </Section>
      <Section title="Contact">
        <p className="text-sm">Questions about your data: theaccuweather@gmail.com</p>
      </Section>
    </div>
  );
}
