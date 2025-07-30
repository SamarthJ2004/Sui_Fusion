// src/app/api/resolver/route.js
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const body = await request.json();
  const { secret_hash } = body;

  const { data } = await supabase.from('Relayer_Data').select('*').eq('secret_hash', secret_hash).single();

  await supabase.from('Relayer_Data').update({
    escrow_creator: 'dd',
    src_escrow_status: 'deployed_locked',
    dst_escrow_status: 'funded',
    status: 'ready_to_reveal',
  }).eq('secret_hash', secret_hash);

  const { data: data2 } = await supabase
    .from('Relayer_Data')
    .select('secret')
    .eq('secret_hash', secret_hash)
    .single();

  await supabase.from('Relayer_Data').update({ status: 'secret_revealed' }).eq('secret_hash', secret_hash);

  return Response.json({ secret: data2.secret });
}
