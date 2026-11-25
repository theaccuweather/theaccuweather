import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RankingView from '@/components/RankingView';
import type { Period } from '@/lib/rankings';

export const revalidate = 3600;
export const dynamicParams = false;

const PAGES: Record<string, { period: Period; title: string; description: string }> = {
  '24-hours': {
    period: '24h',
    title: 'Most polluted cities over the last 24 hours',
    description: 'Ranking of the world’s biggest cities by average US AQI over the last 24 hours.',
  },
  '30-days': {
    period: '30d',
    title: 'Most polluted cities over the last 30 days',
    description: 'Ranking of the world’s biggest cities by average US AQI over the last 30 days.',
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((period) => ({ period }));
}

type Props = { params: Promise<{ period: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { period } = await params;
  const page = PAGES[period];
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/ranking/${period}` } };
}

export default async function RankingPeriodPage({ params }: Props) {
  const { period } = await params;
  const page = PAGES[period];
  if (!page) notFound();
  return <RankingView period={page.period} />;
}
