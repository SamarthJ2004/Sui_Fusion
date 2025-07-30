// src/app/api/orders/add/route.js
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  const body = await request.json();
  const { data, error } = await supabase.from('Relayer_Data').insert(body).single();

  if (error) {
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
