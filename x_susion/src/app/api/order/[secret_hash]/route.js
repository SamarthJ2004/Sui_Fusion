// src/app/api/orders/[secret_hash]/route.js
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  const { secret_hash } = params;

  const { data, error } = await supabase
    .from('Relayer_Data')
    .select('*')
    .eq('secret_hash', secret_hash)
    .single();

  if (error) return Response.json({ error }, { status: 404 });

  return Response.json(data);
}
