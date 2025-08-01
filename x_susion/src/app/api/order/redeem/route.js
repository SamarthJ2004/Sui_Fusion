// src/app/api/resolver/redeem/route.js
import { supabase } from '@/lib/supabase';
import { redeemEscrow } from '@/lib/sui';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiTestnetChain } from '@suiet/wallet-kit';

export async function GET(request) {
  const body = await request.json();
  const {secret_hash, currentAccount} = body;
  const {data, error} = await supabase.from("Relayer_Data").select("secret, chain_src").eq("secret_hash", secret_hash);

  const statusLogger = (status) => console.log("STATUS:", status);
  const signAndExecuteTransactionBlock = useSignAndExecuteTransaction();


  if (data.chain_src == "ethereum") {
    // eth redeem
    await redeemEscrow({currentAccount, preimage: data.secret, isSource: false , setStatus: statusLogger, signAndExecuteTransactionBlock});
  } else {
    await redeemEscrow({currentAccount, preimage: data.secret, isSource: true, setStatus: SuiTestnetChain, signAndExecuteTransactionBlock});
    // eth redeem
  }

  await supabase.from('Relayer_Data').delete().eq('secret_hash', hash);

  return Response.json({ message: 'All funds redeemed' });
}
