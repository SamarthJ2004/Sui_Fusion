// src/app/api/secret/route.js
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret_hash = searchParams.get('secret_hash');

  const { data, error } = await supabase
    .from('Relayer_Data')
    .select('secret, status')
    .eq('secret_hash', secret_hash)
    .single();

  if (error || !data) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  if (data.status !== 'ready_to_reveal') {
    return Response.json({ error: 'Not ready' }, { status: 403 });
  }

  await supabase.from('Relayer_Data').update({ status: 'secret_revealed' }).eq('secret_hash', secret_hash);

  return Response.json({ secret: data.secret });
}
