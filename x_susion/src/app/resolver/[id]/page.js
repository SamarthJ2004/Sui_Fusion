'use client';
import { useParams } from 'next/navigation';
import ResolverDetailPage from '@/components/ResolverDetailPage';

export default function ResolverDetail() {
  const { id } = useParams();
  return <ResolverDetailPage id={id} />;
}
