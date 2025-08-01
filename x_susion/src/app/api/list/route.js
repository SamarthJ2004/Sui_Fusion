// src/app/api/list/route.js
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('Relayer_Data')
    .select('secret_hash,chain_src, chain_dst, token_src, token_dst, amount_src, min_swap_amount, timelock')
    .eq('status', 'created');

  if (!data || data.length === 0) {
    return Response.json({ error: 'No Orders Listed' }, { status: 403 });
  }

  console.log("DAta got: ",data);
  return Response.json({ list: data });
}
