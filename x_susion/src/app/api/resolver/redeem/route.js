// src/app/api/resolver/redeem/route.js
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  const hash = crypto.createHash('sha256').update(secret).digest('hex');

  await supabase.from('Relayer_Data').delete().eq('secret_hash', hash);

  return Response.json({ message: 'All funds redeemed' });
}
