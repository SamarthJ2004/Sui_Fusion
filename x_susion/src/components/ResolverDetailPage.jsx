import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const mockSwaps = [
  {
    id: '1',
    secret_hash: '0xabc123',
    intent_announcer: '0xAnnouncer1',
    chain_src: 'sui',
    chain_dst: 'ethereum',
    token_src: 'SUI',
    token_dst: 'ETH',
    amount_src: '1000000',
    min_swap_amount: '500000',
    timelock: 3600
  },
  {
    id: '2',
    secret_hash: '0xdef456',
    intent_announcer: '0xAnnouncer2',
    chain_src: 'ethereum',
    chain_dst: 'sui',
    token_src: 'ETH',
    token_dst: 'SUI',
    amount_src: '200000',
    min_swap_amount: '100000',
    timelock: 7200
  }
];

function ResolverDetailPage() {
  const { id } = useParams();
  const swap = mockSwaps.find(s => s.id === id);
  const [fulfilled, setFulfilled] = useState(false);

  const handleFulfill = () => setFulfilled(true);
  const handleRedeem = () => alert('Redeem executed');

  if (!swap) return <div className="text-center mt-8">Swap not found</div>;

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Swap Detail: {swap.id}</h2>
      <ul className="mb-4 space-y-2">
        {Object.entries(swap).map(([key, val]) => (
          <li key={key} className="flex justify-between">
            <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
            <span>{val}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={handleFulfill}
        disabled={fulfilled}
        className="w-full bg-green-600 text-white py-2 rounded disabled:bg-gray-400 mb-2"
      >Fulfill Order</button>
      {fulfilled && (
        <button
          onClick={handleRedeem}
          className="w-full bg-purple-600 text-white py-2 rounded"
        >Redeem</button>
      )}
    </div>
  );
}

export default ResolverDetailPage;
