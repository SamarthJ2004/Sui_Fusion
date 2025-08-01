// src/app/api/resolver/status/route.js
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const body = await request.json();
    const { secret_hash } = body;

    const { data, error} = await supabase.from("Relayer_Data").select("src_escrow_status, dst_escrow_status").eq("secret_hash", secret_hash);
    console.log("status data; ", data);

    const { src_escrow_status, dst_escrow_status} = data;

    return NextResponse.json({src_escrow_status, dst_escrow_status});
}
