"use client"
import React, { useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  ConnectButton,
} from "@mysten/dapp-kit";
import {
  createSrcEscrow,
  createDstEscrow,
  redeemEscrow,
  refundEscrow,
} from "../lib/sui";

const Working = () => {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransaction();

  const [preimage, setPreimage] = useState("");
  const [secretHash, setSecretHash] = useState("");
  const [amount, setAmount] = useState(0);
  const [minSwap, setMinSwap] = useState(0);
  const [timelock, setTimelock] = useState(0);
  const [status, setStatus] = useState(null);

  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-end mb-4">
          <ConnectButton
            connectText="Connect Wallet"
            // connectedText={`Connected: ${currentAccount?.address.slice(0, 6)}…`}
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
            onClick={() =>
              createSrcEscrow({
                currentAccount,
                preimage,
                amount,
                minSwap,
                timelock,
                setSecretHash,
                setStatus,
                signAndExecuteTransactionBlock,
              })
            }
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Create Source Escrow
          </button>

          <button
            onClick={() =>
              createDstEscrow({
                currentAccount,
                preimage,
                amount,
                minSwap,
                timelock,
                setStatus,
                signAndExecuteTransactionBlock,
              })
            }
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Create Destination Escrow
          </button>

          <button
            onClick={() =>
              redeemEscrow({
                currentAccount,
                preimage,
                isSource: true,
                setStatus,
                signAndExecuteTransactionBlock,
              })
            }
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >
            Redeem Source
          </button>

          <button
            onClick={() =>
              redeemEscrow({
                currentAccount,
                preimage,
                isSource: false,
                setStatus,
                signAndExecuteTransactionBlock,
              })
            }
            className="w-full bg-indigo-600 text-white py-2 rounded"
          >
            Redeem Destination
          </button>

          <button
            onClick={() =>
              refundEscrow({
                currentAccount,
                secretHash,
                setStatus,
                signAndExecuteTransactionBlock,
              })
            }
            className="w-full bg-red-600 text-white py-2 rounded"
          >
            Refund Escrow
          </button>
        </div>

        {status && <p className="mt-4 text-center text-gray-700">{status}</p>}
      </div>
    </div>
  );
}

export default Working;