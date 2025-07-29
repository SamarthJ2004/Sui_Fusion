import { Router } from 'express';
import { supabase } from '../supabase.js';
const router = Router();

router.put('/status', async (req, res) => {
  const { secret_hash, src_escrow_status, dst_escrow_status } = req.body;
  const updates= {};
  if (src_escrow_status) updates.src_escrow_status = src_escrow_status;
  if (dst_escrow_status) updates.dst_escrow_status = dst_escrow_status;
  const { data, error } = await supabase
    .from('Relayer_Data')
    .update(updates)
    .eq('secret_hash', secret_hash);
  if (error) {
    console.log("Entry not found with secret hash: ", secret_hash);
    return res.status(500).json(error);
  }
  console.log("Entry status updated");
  res.json(data);
});

router.put('/src_escrow', async (req,res) => {
  const {secret_hash, src_escrow_id} = req.body;
  const updates ={};
  updates.src_escrow_id = src_escrow_id;
  updates.src_escrow_status = "funded";
  const { data, error } = await supabase.from("Relayer_Data").update(updates).eq('secret_hash', secret_hash);

  if (error) {
    console.log("Entry not found for secret hash: ", secret_hash);
    return res.status(404).json(error);
  }

  console.log("Source escrow id and status updated to funded");
  res.json(data);
})

router.put('/dst_escrow', async (req,res) => {
  const {secret_hash, dst_escrow_id} = req.body;
  const updates ={};
  updates.dst_escrow_id = dst_escrow_id;
  updates.dst_escrow_status = "funded";
  const { data, error } = await supabase.from("Relayer_Data").update(updates).eq('secret_hash', secret_hash);

  if (error) {
    console.log("Entry not found for secret hash: ", secret_hash);
    return res.status(404).json(error);
  }

  console.log("Destination escrow id and status updated to funded");
  res.json(data);
})

router.put("/status", async (req, res) => {
  const {secret_hash, status} = req.body;
 const { data, error } = await supabase.from("Relayer_Data").update({status}).eq('secret_hash', secret_hash);

  if (error) {
    console.log("Entry not found for secret hash: ", secret_hash);
    return res.status(404).json(error);
  }

  console.log("Order status updated to ", data.status);
  res.json(data); 
})

export default router;