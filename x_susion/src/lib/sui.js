import { Transaction } from "@mysten/sui/transactions";
import { keccak_256 } from "js-sha3";
const encoder = new TextEncoder();

const PACKAGE_ID =
  "0x14c4082eede186b248ef8342db8d21168d9e1458b2878b169eff4f6861636f62";
const STORE_ID =
  "0xa7ee9f1d691ac7c4e3dd9a2a03531a38024dc8485282a34844a52fec6f6752d8";

export async function createSrcEscrow({
  currentAccount,
  preimage,
  amount,
  minSwap,
  timelock,
  setSecretHash,
  setStatus,
  signAndExecuteTransactionBlock,
}) {
  if (!currentAccount) return setStatus("Connect wallet first");
  setStatus("Creating source escrow…");
  const hashBytes = Array.from(keccak_256.array(preimage));
  setSecretHash(hashBytes);

  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [
    tx.pure("u64", BigInt(amount * 1e9)),
  ]);

  tx.moveCall({
    target: `${PACKAGE_ID}::fusion_contract::create_src_escrow`,
    arguments: [
      tx.object(STORE_ID),
      tx.pure.vector("u8", hashBytes),
      tx.pure("u64", BigInt(amount * 1e9)),
      tx.pure("u64", BigInt(minSwap * 1e9)),
      tx.pure("u64", BigInt(timelock)),
      coin,
      tx.pure("address", currentAccount.address),
    ],
  });

  try {
    await signAndExecuteTransactionBlock({ transaction: tx });
    setStatus("Source escrow created.");
  } catch (e) {
    setStatus("Error: " + e.message);
  }
}

export async function createDstEscrow({
  currentAccount,
  preimage,
  amount,
  minSwap,
  timelock,
  setStatus,
  signAndExecuteTransactionBlock,
}) {
  if (!currentAccount) return setStatus("Connect wallet first");
  setStatus("Creating destination escrow…");
  const hashBytes = Array.from(keccak_256.array(preimage));

  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [
    tx.pure("u64", BigInt(amount * 1e9)),
  ]);

  tx.moveCall({
    target: `${PACKAGE_ID}::fusion_contract::create_dst_escrow`,
    arguments: [
      tx.object(STORE_ID),
      tx.pure.vector("u8", hashBytes),
      tx.pure("u64", BigInt(amount * 1e9)),
      tx.pure("u64", BigInt(minSwap * 1e9)),
      tx.pure("u64", BigInt(timelock)),
      coin,
      tx.pure("address", currentAccount.address),
    ],
  });

  try {
    await signAndExecuteTransactionBlock({ transaction: tx });
    setStatus("Destination escrow created.");
  } catch (e) {
    setStatus("Error: " + e.message);
  }
}

export async function redeemEscrow({
  currentAccount,
  preimage,
  isSource,
  setStatus,
  signAndExecuteTransactionBlock,
}) {
  if (!currentAccount) return setStatus("Connect wallet first");
  setStatus("Redeeming escrow…");

  const hashBytes = Array.from(encoder.encode(preimage));
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::fusion_contract::redeem`,
    arguments: [
      tx.object(STORE_ID),
      tx.pure.vector("u8", hashBytes),
      tx.pure("bool", isSource),
    ],
  });

  try {
    await signAndExecuteTransactionBlock({ transaction: tx });
    setStatus("Redeemed successfully.");
  } catch (e) {
    setStatus("Error: " + e.message);
  }
}

export async function refundEscrow({
  currentAccount,
  secretHash,
  setStatus,
  signAndExecuteTransactionBlock,
}) {
  if (!currentAccount) return setStatus("Connect wallet first");
  setStatus("Refunding escrow…");

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::fusion_contract::refund`,
    arguments: [
      tx.object(STORE_ID),
      tx.pure.vector("u8", secretHash),
    ],
  });

  try {
    await signAndExecuteTransactionBlock({ transaction: tx });
    setStatus("Refunded successfully.");
  } catch (e) {
    setStatus("Error: " + e.message);
  }
}
