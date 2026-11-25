import type { Metadata } from 'next';
import RankingView from '@/components/RankingView';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Most polluted cities in the world right now',
  description: 'Live US AQI ranking of the world’s biggest cities, from most to least polluted.',
  alternates: { canonical: '/ranking' },
};

export default function RankingPage() {
  return <RankingView period="now" />;
}
