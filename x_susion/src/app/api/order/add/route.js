// src/app/api/orders/add/route.js
import { supabase } from '@/lib/supabase';
import crypto from "crypto";

export async function POST(request) {
  const body = await request.json();
  const secret = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(secret).digest('hex');
  body.secret = secret;
  body.secret_hash = hash;
  body.timelock = Math.floor(Date.now()/1000) + body.timelock;
  body.src_escrow_status = "pending";
  body.dst_escrow_status = "pending";
  body.status = "created";
  const { data, error } = await supabase.from('Relayer_Data').insert(body).single();

  if (error) {
    console.log("error: ", error);
    return Response.json({ error }, { status: 500 });
  }

  console.log("Data inserted into the table: ", data);
  return Response.json(secret, { status: 201 });
}
