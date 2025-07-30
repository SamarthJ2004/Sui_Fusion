import React from 'react';
import { ExternalLink, Clock, ArrowRight } from 'lucide-react';

// Mock data since we don't have the actual mockSwaps
const mockSwaps = [
  {
    id: "0x1a2b3c",
    secret_hash: "0x4d5e6f7890abcdef...",
    intent_announcer: "0x123456789abcdef...",
    chain_src: "ethereum",
    chain_dst: "sui",
    amount_src: "1.5 ETH",
    timelock: "2024-07-31 15:30"
  },
  {
    id: "0x2b3c4d",
    secret_hash: "0x7890abcdef123456...",
    intent_announcer: "0x987654321fedcba...",
    chain_src: "sui",
    chain_dst: "ethereum",
    amount_src: "1000 SUI",
    timelock: "2024-07-31 16:45"
  },
  {
    id: "0x3c4d5e",
    secret_hash: "0xabcdef1234567890...",
    intent_announcer: "0xfedcba987654321...",
    chain_src: "ethereum",
    chain_dst: "sui",
    amount_src: "0.75 ETH",
    timelock: "2024-07-31 14:20"
  }
];

const ResolverListPage = () => {
  const getChainIcon = (chain) => {
    return chain === 'ethereum' ? '♦' : 'S';
  };

  const getChainColor = (chain) => {
    return chain === 'ethereum' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Open Swaps</h2>
          <p className="text-gray-400">Active cross-chain swap orders available for resolution</p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="bg-gray-700 px-6 py-4">
              <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-300">
                <div>ID</div>
                <div>Secret Hash</div>
                <div>Announcer</div>
                <div>From</div>
                <div>To</div>
                <div>Amount</div>
                <div>Timelock</div>
              </div>
            </div>
            <div className="divide-y divide-gray-700">
              {mockSwaps.map((swap, index) => (
                <div key={swap.id} className="px-6 py-4 hover:bg-gray-750 transition-colors">
                  <div className="grid grid-cols-7 gap-4 items-center">
                    <div>
                      <button className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center space-x-1">
                        <span>{swap.id}</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                    <div className="font-mono text-sm text-gray-300">
                      {truncateAddress(swap.secret_hash)}
                    </div>
                    <div className="font-mono text-sm text-gray-300">
                      {truncateAddress(swap.intent_announcer)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 ${getChainColor(swap.chain_src)} rounded-full flex items-center justify-center text-xs font-bold`}>
                        {getChainIcon(swap.chain_src)}
                      </div>
                      <span className="text-sm font-medium">{swap.chain_src.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 ${getChainColor(swap.chain_dst)} rounded-full flex items-center justify-center text-xs font-bold`}>
                        {getChainIcon(swap.chain_dst)}
                      </div>
                      <span className="text-sm font-medium">{swap.chain_dst.toUpperCase()}</span>
                    </div>
                    <div className="font-medium">{swap.amount_src}</div>
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
          {mockSwaps.map((swap, index) => (
            <div key={swap.id} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button className="text-blue-400 hover:text-blue-300 font-mono text-sm flex items-center space-x-1">
                  <span>{swap.id}</span>
                  <ExternalLink size={14} />
                </button>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Clock size={14} />
                  <span>{swap.timelock}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getChainColor(swap.chain_src)} rounded-full flex items-center justify-center font-bold`}>
                    {getChainIcon(swap.chain_src)}
                  </div>
                  <span className="font-medium">{swap.chain_src.toUpperCase()}</span>
                </div>
                <ArrowRight className="text-gray-400" size={20} />
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getChainColor(swap.chain_dst)} rounded-full flex items-center justify-center font-bold`}>
                    {getChainIcon(swap.chain_dst)}
                  </div>
                  <span className="font-medium">{swap.chain_dst.toUpperCase()}</span>
                </div>
              </div>

              <div className="text-xl font-semibold mb-2">{swap.amount_src}</div>
              
              <div className="space-y-1 text-sm text-gray-400">
                <div>Hash: <span className="font-mono">{truncateAddress(swap.secret_hash)}</span></div>
                <div>Announcer: <span className="font-mono">{truncateAddress(swap.intent_announcer)}</span></div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {mockSwaps.length === 0 && (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Clock size={48} className="mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Open Swaps</h3>
              <p>There are currently no active swap orders available for resolution.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResolverListPage;