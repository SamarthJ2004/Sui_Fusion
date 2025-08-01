"use client";
import React, { useState, useEffect } from "react";
import { ExternalLink, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const ResolverListPage = () => {
  const [list, setList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/list/");
        const data = await response.json();
        if (data.list) {
          setList(data.list);
          console.log("data: ", data.list);
        } else {
          console.error("Error fetching list:", data.error);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    fetchData();
  }, []);

  const getChainIcon = (chain) => (chain === "ethereum" ? "♦" : "S");
  const getChainColor = (chain) =>
    chain === "ethereum" ? "bg-blue-500" : "bg-purple-500";
  const truncateAddress = (address) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Open Swaps</h2>
          <p className="text-gray-400">
            Active cross-chain swap orders available for resolution
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-700 px-6 py-4">
              <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-300">
                <div>Secret Hash</div>
                <div>From Chain</div>
                <div>From Token</div>
                <div>From Amt</div>
                <div>To Chain</div>
                <div>To Token</div>
                <div>To Amt</div>
                <div>Timelock</div>
              </div>
            </div>
            <div className="divide-y divide-gray-700">
              {list.map((swap, index) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-gray-750 transition-colors"
                >
                  <div className="grid grid-cols-8 gap-4 items-center">
                    <Link href={`/resolver/${swap.secret_hash}`}>
                      <span className="hover:text-blue-400 cursor-pointer">
                        {truncateAddress(swap.secret_hash)}<ExternalLink size={10}/>
                      </span>
                    </Link>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 ${getChainColor(
                          swap.chain_src
                        )} rounded-full flex items-center justify-center text-xs font-bold`}
                      >
                        {getChainIcon(swap.chain_src)}
                      </div>
                      <span className="text-sm font-medium">
                        {swap.chain_src.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-medium">{swap.token_src}</div>
                    <div className="font-medium">{swap.amount_src}</div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-6 h-6 ${getChainColor(
                          swap.chain_dst
                        )} rounded-full flex items-center justify-center text-xs font-bold`}
                      >
                        {getChainIcon(swap.chain_dst)}
                      </div>
                      <span className="text-sm font-medium">
                        {swap.chain_dst.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-medium">{swap.token_dst}</div>
                    <div className="font-medium">{swap.min_swap_amount}</div>
                    <div className="flex items-center space-x-1 text-sm text-gray-300">
                      <Clock size={14} />
                      <span>{swap.timelock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {list.map((swap, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-sm">
                  {truncateAddress(swap.secret_hash)}
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Clock size={14} />
                  <span>{swap.timelock}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 ${getChainColor(
                      swap.chain_src
                    )} rounded-full flex items-center justify-center font-bold`}
                  >
                    {getChainIcon(swap.chain_src)}
                  </div>
                  <span className="font-medium">
                    {swap.chain_src.toUpperCase()}
                  </span>
                </div>
                <ArrowRight className="text-gray-400" size={20} />
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 ${getChainColor(
                      swap.chain_dst
                    )} rounded-full flex items-center justify-center font-bold`}
                  >
                    {getChainIcon(swap.chain_dst)}
                  </div>
                  <span className="font-medium">
                    {swap.chain_dst.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-xl font-semibold mb-2">
                {swap.amount_src}
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <div>
                  From Token:{" "}
                  <span className="font-mono">{swap.token_src}</span>
                </div>
                <div>
                  To Token: <span className="font-mono">{swap.token_dst}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {list.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-12 text-center mt-6">
            <Clock size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium mb-2">No Open Swaps</h3>
            <p className="text-gray-400">
              There are currently no active swap orders available for
              resolution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResolverListPage;
