import {Router} from "express";
import { supabase } from "../supabase";

const router = Router();

router.get('/', async (req, res) => {
    const {data, error }=await supabase.from('Relayer_Data').select('chain_src','chain_dst', 'token_src','token_dst', 'amount_src','min_swap_amount','timelock').eq('status','created');

    if (data.length == 0) {
        console.log("No order listed");
        return res.status(403).json({error: "No Orders Listed"});
    }

    console.log("Number of orders listed: ", data.length);
    res.json({list: data});
});

router.get('/:secret_hash', async (req, res) => {
    const { data, error }=await supabase.from('Relayer_Data').select('chain_src','chain_dst', 'token_src','token_dst', 'amount_src','min_swap_amount','timelock').eq("secret_hash", req.body.secret_hash);

    console.log("Number of orders listed: ", data);
    res.json({order_data: data});
});

export default router;