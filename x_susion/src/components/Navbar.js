// src/components/Navbar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@mysten/dapp-kit';

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

export default function Navbar() {
  return (
    <nav className="bg-gray-800 py-4 px-8 flex justify-between rounded-t-3xl text-white">
      <div className="flex space-x-8">
        <NavLink href="/">Swap</NavLink>
        <NavLink href="/resolver">Resolver List</NavLink>
      </div>
      <ConnectButton
        connectText="Connect Wallet"
        // connectedText={`Connected: ${currentAccount?.address.slice(0, 6)}…`}
        className="rounded-lg text-white bg-blue-40 px-3 py-2"
      />
    </nav>
  );
}
