import { Router } from 'express';
import { supabase } from '../supabase.js';
const router = Router();

router.post('/add', async (req, res) => {
  const { data, error } = await supabase.from('Adv_Relayer_Data').insert(req.body).single();
  if (error) {
    console.log("Error: ", error);
    return res.status(500).json(error);
  }
  console.log("Order added to the table");
  res.status(201).json(data);
});

router.get('/:secret_hash', async (req, res) => {
  const { data, error } = await supabase
    .from('Adv_Relayer_Data')
    .select('*')
    .eq('secret_hash', req.params.secret_hash)
    .single();
  if (error){ 
    console.log("No entry with the secret hash: ", secret_hash);
    return res.status(404).json(error);
  }
  console.log("Found entry with secret hash: ", secret_hash);
  res.json(data);
});

export default router;