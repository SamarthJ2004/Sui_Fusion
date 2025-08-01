import { useState } from 'react';
import { ethers } from 'ethers';

export default function EthereumConnectButton() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  };

  return (
    <button
      onClick={connectWallet}
      className="rounded-lg text-white bg-green-500 px-3 py-2"
    >
      {account ? `Connected: ${account.slice(0, 6)}...` : 'Connect Wallet (ETH)'}
    </button>
  );
}
