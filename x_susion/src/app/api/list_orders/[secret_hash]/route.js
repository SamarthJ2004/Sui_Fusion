// src/app/api/list/[secret_hash]/route.js
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  const { secret_hash } = params;

  const { data, error } = await supabase
    .from('Relayer_Data')
    .select('chain_src, chain_dst, token_src, token_dst, amount_src, min_swap_amount, timelock')
    .eq('secret_hash', secret_hash);

  return Response.json({ order_data: data });
}
