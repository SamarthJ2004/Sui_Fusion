import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Clock,
  Coins,
  Hash,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const OrderDetails = ({ secret_hash }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeemStatus, setRedeemStatus] = useState(false);

  const fetchOrderData = async () => {
    if (!secret_hash) return;

    setLoading(true);
    setError(null);

    try {
      let response = await fetch(`/api/list/${secret_hash}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order data: ${response.status}`);
      }
      let result = await response.json();
      setOrderData(result.order_data);

      response = await fetch("/api/resolver/status", {
        method: "POST",
        header: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret_hash }),
      });

      result = await response.json();
      setRedeemStatus(
        result.src_escrow_status == "deplyed_locked" &&
        result.dst_escrow_status == "funded"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [secret_hash]);

  const getChainIcon = (chain) => {
    return chain?.toLowerCase() === "ethereum" ? "♦" : "S";
  };

  const getChainColor = (chain) => {
    return chain?.toLowerCase() === "ethereum"
      ? "bg-blue-500"
      : "bg-purple-500";
  };

  const formatTimelock = (timelock) => {
    if (!timelock) return "N/A";
    try {
      const date = new Date(timelock);
      return date.toLocaleString();
    } catch {
      return timelock;
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const execute_order = async () => {
    const response = await fetch("/resolver/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentAccount, secret_hash }),
    });
    const data = await response.json();

    console.log("Secret Revealed: ", data.secret);
  };

  const cancel_order = async () => {
    const response = await fetch("/order/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentAccount, secret_hash }),
    });
  };

  const redeem_order = async () => {
    const response = await fetch("/order/redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentAccount, secret_hash }),
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold mb-2">
              Loading Order Details
            </h2>
            <p className="text-gray-400">
              Fetching data for {truncateHash(secret_hash)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-semibold mb-2 text-red-400">
              Error Loading Order
            </h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchOrderData}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
              {/* {onClose && (
                <button 
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              )} */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData || orderData.length === 0) {
    return (
      <div className="bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <Hash className="mx-auto mb-4 text-gray-500" size={48} />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-gray-400">
              No order data found for hash: {truncateHash(secret_hash)}
            </p>
            {/* {onClose && (
              <button 
                onClick={onClose}
                className="mt-4 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            )} */}
          </div>
        </div>
      </div>
    );
  }

  const order = orderData[0]; // Assuming single order result

  return (
    <div className="bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
            <p className="text-gray-400">
              Secret Hash: {truncateHash(secret_hash)}
            </p>
          </div>
          {/* {onClose && (
            <button 
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          )} */}
        </div>

        {/* Main Order Card */}
        <div className="bg-gray-800 rounded-xl p-8 mb-6">
          {/* Chain Direction */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div
                  className={`w-16 h-16 ${getChainColor(
                    order.chain_src
                  )} rounded-full flex items-center justify-center text-2xl font-bold mb-3 mx-auto`}
                >
                  {getChainIcon(order.chain_src)}
                </div>
                <h3 className="text-lg font-semibold">
                  {order.chain_src?.toUpperCase()}
                </h3>
                <p className="text-gray-400 text-sm">Source Chain</p>
              </div>

              <ArrowRight className="text-gray-400" size={32} />

              <div className="text-center">
                <div
                  className={`w-16 h-16 ${getChainColor(
                    order.chain_dst
                  )} rounded-full flex items-center justify-center text-2xl font-bold mb-3 mx-auto`}
                >
                  {getChainIcon(order.chain_dst)}
                </div>
                <h3 className="text-lg font-semibold">
                  {order.chain_dst?.toUpperCase()}
                </h3>
                <p className="text-gray-400 text-sm">Destination Chain</p>
              </div>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Information */}
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Coins className="text-green-400" size={20} />
                <h3 className="text-lg font-semibold">Amount Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Source Amount:</span>
                  <span className="font-semibold">
                    {order.amount_src || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Min Swap Amount:</span>
                  <span className="font-semibold">
                    {order.min_swap_amount || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Token Information */}
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Hash className="text-blue-400" size={20} />
                <h3 className="text-lg font-semibold">Token Details</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Source Token:</span>
                  <span className="font-semibold">
                    {order.token_src || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Destination Token:</span>
                  <span className="font-semibold">
                    {order.token_dst || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timelock Information */}
            <div className="bg-gray-700 rounded-lg p-6 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="text-yellow-400" size={20} />
                <h3 className="text-lg font-semibold">Timelock</h3>
              </div>
              <div className="text-center">
                <p className="text-2xl font-mono">
                  {formatTimelock(order.timelock)}
                </p>
                <p className="text-gray-400 text-sm mt-1">Expiration Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={fetchOrderData}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Refresh Data</span>
          </button>
          {redeemStatus ? (
            <button
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors"
              onClick={redeem_order}
            >
              Redeem Funds
            </button>
          ) : (
            <button
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors"
              onClick={execute_order}
            >
              Execute Order
            </button>
          )}
          <button
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors"
            onClick={cancel_order}
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
