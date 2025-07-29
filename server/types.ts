// relayer/types.ts

export interface SwapOrder {
  secret_hash: string;
  secret: string; // kept encrypted or in secure vault
  intent_announcer: string;
  chain_src: 'sui' | 'ethereum';
  chain_dst: 'ethereum' | 'sui';
  token_src: string;
  token_dst: string;
  amount_src: string; // in smallest units (e.g., 1000000 microSUI)
  min_swap_amount: string;
  timelock: number; // Unix timestamp in ms
  
  escrow_creator: string,
  src_escrow_id: string,
  dst_escrow_id: string,

  src_escrow_status: 'pending' | 'deployed_locked' | 'redeemed';
  dst_escrow_status: 'pending' | 'deployed' | 'funded' | 'redeemed';
  status: 'created' | 'ready_to_reveal' | 'secret_revealed' | 'completed' | 'expired';

  created_at: string; // ISO timestamp
  updated_at: string;
}
