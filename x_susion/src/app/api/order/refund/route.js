import { supabase } from "@lib/supabase";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { refundEscrow } from "@/lib/sui";
import { NextResponse } from "next/server";

export async function POST(request) {
    const body = await request.json();
    const { currentAccount, secret_hash } = body;

    const statusLogger = (status) => console.log("STATUS:", status);
    const signAndExecuteTransactionBlock = useSignAndExecuteTransaction();

    const { data, error } = await supabase.from("Relayer_Data").select("chain_src", "src_escrow_status", "dst_escrow_status").eq('secret_hash', secret_hash);

    if (data.src_escrow_status == "pending" && data.dst_escrow_status == "pending") {
        await supabase.from("Relayer_Data").delete().eq("secret_hash", secret_hash);
    } else if (data.src_escrow_status == "pending") {
        if (data == "sui") {
            await refundEscrow({
                currentAccount,
                secret_hash,
                setStatus: statusLogger,
                signAndExecuteTransactionBlock,
            });
        } else {
            // eth refund
        }
    } else {
        return NextResponse.json({ message: "Refund cannot be initiated as both contractss are deployed" });
    }

    await supabase.from("Relayer_Data").delete().eq("secret_hash", secret_hash);

    return NextResponse.json({ message: "Refund done" });

}