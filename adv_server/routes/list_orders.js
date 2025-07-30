import {Router} from "express";
import { supabase } from "../supabase";

const router = Router();

router.get('/', async (req, res) => {
    const {data, error }=await supabase.from('Adv_Relayer_Data').select('chain_src','chain_dst', 'token_src','token_dst', 'amount_src','swap_amount','resolvers_balance','timelock').eq('status','created');

    if (data.length == 0) {
        console.log("No order listed");
        return res.status(403).json({error: "No Orders Listed"});
    }

    console.log("Number of orders listed: ", data.length);
    res.json({list: data});
});

export default router;