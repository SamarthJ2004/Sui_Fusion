import { Router } from 'express';
import { supabase } from '../supabase.js';
const router = Router();

router.get('/', async (req, res) => {
  const { secret_hash } = req.query;
  const { data, error } = await supabase
    .from('Relayer_Data')
    .select('secret, status')
    .eq('secret_hash', secret_hash)
    .single();
  if (data.status !== 'ready_to_reveal') {
    return res.status(403).json({ error: 'Not ready' });
  } else if (error) {
    console.log("Entry not found with secret hash: ", secret_hash);
    return res.status(404).json({error: "Not found"});
  }
  console.log(`Secret : ${data.secret} for secret hash: ${secret_hash}`);
  res.json({ secret: data.secret });
});

export default router;