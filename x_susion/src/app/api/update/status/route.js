// src/app/api/update/status/route.js
import { supabase } from '@/lib/supabase';

export async function PUT(request) {
  const { secret_hash, src_escrow_status, dst_escrow_status, status } = await request.json();

  const updates = {};
  if (src_escrow_status) updates.src_escrow_status = src_escrow_status;
  if (dst_escrow_status) updates.dst_escrow_status = dst_escrow_status;
  if (status) updates.status = status;

  const { data, error } = await supabase.from('Relayer_Data').update(updates).eq('secret_hash', secret_hash);

  if (error) return Response.json(error, { status: 500 });

  return Response.json(data);
}
