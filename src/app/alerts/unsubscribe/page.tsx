import type { Metadata } from 'next';
import Section from '@/components/Section';
import TokenAction from '@/components/TokenAction';

export const metadata: Metadata = { title: 'Unsubscribe from alerts', robots: { index: false } };
type Props = { searchParams: Promise<{ token?: string }> };

export default async function Page({ searchParams }: Props) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-lg py-10">
      <Section title="Unsubscribe from alerts">
        {token ? (
          <>
            <p className="mb-4 text-sm text-muted">Click the button to stop these alerts. Your email address is deleted straight away.</p>
            <TokenAction token={token} action="unsubscribe" />
          </>
        ) : <p className="text-sm">This link is missing its code. Open the link from your email again.</p>}
      </Section>
    </div>
  );
}
