import React, { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  ConnectButton,
} from "@mysten/dapp-kit";
import { keccak_256 } from "js-sha3";

const PACKAGE_ID =
  "0xaf70d3e6690ba2803b94af7f157bbe3e42e5b604221703a9123fcd06b94162cb"; // replace with your package ID
const STORE_ID =
  "0x229b24684ff60c77e067116dd800f2de8a919e736931b068cf470d1d093fbffc";

const encoder = new TextEncoder();

const Working = () => {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransaction();
  const [secretHash, setSecretHash] = useState("");
  const [preimage, setPreimage] = useState("");
  const [amount, setAmount] = useState(0);
  const [minSwap, setMinSwap] = useState(0);
  const [timelock, setTimelock] = useState(0);
  const [status, setStatus] = useState(null);

  async function createSrcEscrow() {
    if (!currentAccount) return setStatus("Connect wallet first");
    setStatus("Creating source escrow…");
    const bytes = encoder.encode(preimage);
    setSecretHash(Array.from(bytes));
    const hashBytes = Array.from(keccak_256.array(preimage));
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

  async function createDstEscrow() {
    if (!currentAccount) return setStatus("Connect wallet first");
    setStatus("Creating destination escrow…");
    const hashBytes = Array.from(keccak_256.array(preimage));
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(BigInt(amount * 1e9))]);
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

  async function redeemEscrow(isSrc) {
    if (!currentAccount) return setStatus("Connect wallet first");
    setStatus("Redeeming escrow…");
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::fusion_contract::redeem`,
      arguments: [
        tx.object(STORE_ID),
        tx.pure(Array.from(new TextEncoder().encode(preimage))),
        tx.pure(isSrc),
      ],
    });
    try {
      await signAndExecuteTransactionBlock({ transaction: tx });
      setStatus("Redeemed successfully.");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  async function refundEscrow() {
    if (!currentAccount) return setStatus("Connect wallet first");
    setStatus("Refunding escrow…");
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::fusion_contract::refund`,
      arguments: [
        tx.object(STORE_ID),
        tx.pure(Array.from(new TextEncoder().encode(secretHash))),
      ],
    });
    try {
      await signAndExecuteTransactionBlock({ transaction: tx });
      setStatus("Refunded successfully.");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-end mb-4">
          <ConnectButton
            connectText="Connect Wallet"
            connectedText={`Connected: ${currentAccount?.address.slice(0, 6)}…`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          />
        </div>
        <h1 className="text-xl text-blue-600 font-bold mb-4">
          Escrow Factory Demo
        </h1>

        <input
          type="text"
          placeholder="Preimage"
          value={preimage}
          onChange={(e) => setPreimage(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Amount (SUI)"
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Min swap amount"
          onChange={(e) => setMinSwap(Number(e.target.value))}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Timelock (ms)"
          onChange={(e) => setTimelock(Number(e.target.value))}
          className="w-full mb-4 p-2 border rounded"
        />
        <div className="space-y-2">
          <button
            onClick={createSrcEscrow}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Create Source Escrow
          </button>
          <button
            onClick={createDstEscrow}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Create Destination Escrow
          </button>
          <button
            onClick={() => redeemEscrow(true)}
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >
            Redeem Source
          </button>
          <button
            onClick={() => redeemEscrow(false)}
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >
            Redeem Destination
          </button>
          <button
            onClick={refundEscrow}
            className="w-full bg-red-600 text-white py-2 rounded"
          >
            Refund Source
          </button>
        </div>
        {status && <p className="mt-4 text-center text-gray-700">{status}</p>}
      </div>
    </div>
  );
}

export default Working;