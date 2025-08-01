'use client';
import { useParams } from 'next/navigation';
import ResolverDetailPage from '@/components/ResolverDetailPage';

export default function ResolverDetail() {
  const { secret_hash } = useParams();
  console.log("secret_hash: ",secret_hash);
  return <ResolverDetailPage secret_hash={secret_hash} />;
}
