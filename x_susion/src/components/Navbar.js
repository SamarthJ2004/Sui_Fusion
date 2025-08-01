'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@mysten/dapp-kit';
import { useState } from 'react';
import { ethers } from 'ethers';

const NavLink = ({ href, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href}>
      <span className={`hover:font-bold font-medium ${isActive ? 'text-white border-b-2 border-blue-500' : ''}`}>
        {children}
      </span>
    </Link>
  );
};

function EthereumConnectButton() {
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

export default function Navbar({ src_chain }) {
  const pathname = usePathname();

  const isHomePage = pathname === '/';

  return (
    <nav className="bg-gray-800 py-4 px-8 flex justify-between rounded-t-3xl text-white">
      <div className="flex space-x-8">
        <NavLink href="/">Swap</NavLink>
        <NavLink href="/resolver">Resolver List</NavLink>
      </div>

      <div className="flex space-x-4">
        {isHomePage ? (
          src_chain === 'ethereum' ? (
            <EthereumConnectButton />
          ) : (
            <ConnectButton
              connectText="Connect Sui Wallet"
              className="rounded-lg text-white bg-blue-400 px-3 py-2"
            />
          )
        ) : (
          <>
            <EthereumConnectButton />
            <ConnectButton
              connectText="Connect Sui Wallet"
              className="rounded-lg text-white bg-blue-400 px-3 py-2"
            />
          </>
        )}
      </div>
    </nav>
  );
}
