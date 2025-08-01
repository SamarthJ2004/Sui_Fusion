"use client";
import React, { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Navbar from "./Navbar";

const tokens = {
  sui: [{ symbol: "SUI", name: "Sui", price: 100 }],
  ethereum: [{ symbol: "ETH", name: "Ethereum", price: 300 }],
};

const SwapPage = () => {
  const [fromChain, setFromChain] = useState("ethereum");
  const [toChain, setToChain] = useState("sui");
  const [fromToken, setFromToken] = useState(tokens[fromChain][0]);
  const [toToken, setToToken] = useState(tokens[toChain][0]);
  const [fromAmount, setFromAmount] = useState("1");
  const [toAmount, setToAmount] = useState(fromAmount * fromToken.price / toToken.price);
  const [activeTab, setActiveTab] = useState("Swap");
  const [secret, setSecret] = useState("");
  const [timelock, setTimelock] = useState("");
  const [refund, setRefund] = useState(false);
  const currentAccount = useCurrentAccount();

  const handleSwap = () => {
    // Swap the chains and tokens
    const tempChain = fromChain;
    const tempToken = fromToken;
    const tempAmount = fromAmount;

    setFromChain(toChain);
    setToChain(tempChain);
    setFromToken(typeof toToken === "string" ? tokens[toChain][0] : toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleConnectWallet = () => {
    alert("Connect wallet functionality would be implemented here");
  };
  
  const doSwap = async() => {
    const response = await fetch("/api/order/add", {
      method: "POST",
      header: {
        'Content-Type' :"application/json",
      },
      body: JSON.stringify({intent_announcer: currentAccount.address,chain_src: fromChain, chain_dst: toChain, token_src: fromToken.symbol, token_dst: toToken.symbol, amount_src: fromAmount, min_swap_amount: toAmount, timelock})
    });
    const data = await response.json();
    setSecret(data);
    setRefund(true);
  }

  const doRefund = async() => {
    const response = await fetch("/api/order/refund", {
      method: "POST",
      header: {
        'Content-Type' : "application/json",
      },
      body: JSON.stringify({secret})
    });

    const data = await response.json();
    console.log(data);
    setRefund(false);
  }

  return (
    <>
    <Navbar src_chain={fromChain}/>
    <div className="bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-6">
            <button
              className={`text-lg font-medium ${
                activeTab === "Swap" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("Swap")}
            >
              Swap
            </button>
            <button
              className={`text-lg font-medium ${
                activeTab === "Limit" ? "text-white" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("Limit")}
            >
              Limit
            </button>
          </div>
        </div>

        {/* From Token Section */}
        <div className="bg-gray-800 rounded-xl p-4 mb-1">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">You pay</span>
            <input
              className="text-white text-l font-medium py-1 bg-transparent w-20 text-right"
              placeholder="Amount to Swap"
              value={fromAmount}
              onChange={(e) => {
                setFromAmount(e.target.value);
                setToAmount((e.target.value * fromToken.price) / toToken.price);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {fromToken.symbol === "ETH" ? "♦" : "S"}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-white font-medium">
                    {fromToken.symbol}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-400 text-sm">
                  on {fromToken.name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">{fromChain}</div>
              <div className="text-gray-400 text-sm">
                $ {fromToken.price * fromAmount}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center py-2">
          <button
            onClick={handleSwap}
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To Token Section */}
        <div className="bg-gray-800 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">You Get</span>
            <span className="text-white text-l font-medium py-1 bg-transparent w-20 text-right">
              {toAmount}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {fromToken.symbol === "ETH" ? "S" : "♦"}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-white font-medium">
                    {toToken.symbol}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-400 text-sm">on {toChain}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">{toChain}</div>
              <div className="text-gray-400 text-sm">
                $ {toToken.price * toAmount}
              </div>
            </div>
          </div>
        </div>

        {/* Connect Wallet Button */}
        {!currentAccount ? (
          <button
            onClick={handleConnectWallet}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium text-lg transition-colors"
          >
            Connect wallet
          </button>
        ) : (
          <>
          {/* <input placeholder="Enter the secret" className="text-black bg-white w-full rounded-xl p-4 mb-2" onChange={e => setSecret(e.target.value)} value={secret}/> */}
          <input placeholder="Enter the timelock" className="text-black bg-white w-full rounded-xl p-4 mb-2" onChange={e => setTimelock(e.target.value)} value={timelock}/>
          <button onClick={doSwap} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium text-lg transition-colors">Swap</button>
          {refund && <button onClick={doRefund} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-medium text-lg transition-colors mt-4">Refund: {secret}</button>}
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default SwapPage;
