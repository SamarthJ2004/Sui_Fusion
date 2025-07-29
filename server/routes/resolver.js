import { Router } from 'express';
import { supabase } from '../supabase.js';
import crypto from "crypto";

const router = Router();

const PACKAGE_ID=0xaf70d3e6690ba2803b94af7f157bbe3e42e5b604221703a9123fcd06b94162cb;
const STORE_ID=0x229b24684ff60c77e067116dd800f2de8a919e736931b068cf470d1d093fbffc;

router.get("/", async (req,res) => {
    let {secret_hash} = req.body;
    let {data, error} = await supabase.from("Relayer_Data").select("*").eq("secret_hash", secret_hash).single();

    //create escrow
    await supabase.from("Relayer_Data").update({escrow_creator: "dd",src_escrow_status: 'deployed_locked', dst_escrow_status: "funded", status: "ready_to_reveal"}).eq("secret_hash", secret_hash);

    res.json({message: "Escrows deployed successfully"});

    let {data2, error2 } = await supabase.from("Relayer_Data").select("secret").eq("secret_hash", secret_hash).single();
    await supabase.from("Relayer_Data").update({status: "secret_revealed"}).eq("secret_hash", secret_hash); 
    res.json({secret: data2.secret});
});

router.get("/redeem", async(req, res) => {
    let {secret} = req.body;

    let hasher = crypto.createHash("sha256");
    let output = hasher.update(secret);
    let secret_hash = hasher.digest(output);

    //redeem functions called
    await supabase.from("Relayer_Data").delete().eq("secret_hash", secret_hash);
    res.json({message: "All funds redeemed"});
});

export default router;