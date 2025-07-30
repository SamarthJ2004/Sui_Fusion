// src/app/api/update/src_escrow/route.js
import { supabase } from '@/lib/supabase';

export async function PUT(request) {
  const { secret_hash, src_escrow_id } = await request.json();

  const updates = {
    src_escrow_id,
    src_escrow_status: 'funded',
  };

  const { data, error } = await supabase.from('Relayer_Data').update(updates).eq('secret_hash', secret_hash);

  if (error) return Response.json(error, { status: 404 });

  return Response.json(data);
}
