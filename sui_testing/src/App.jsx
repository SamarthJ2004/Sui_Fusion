import { Routes, Route, NavLink } from 'react-router-dom';
import SwapPage from './pages/SwapPage';
import ResolverListPage from './pages/ResolverListPage';
import ResolverDetailPage from './pages/ResolverDetailsPage';
import Working from './pages/working';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';

const App= () => {
  const currentAccount = useCurrentAccount();
  return (
    <div className="flex flex-col bg-gray-600 w-[1200px] m-auto rounded-3xl">
      <nav className="bg-gray-800 py-4 px-8 flex justify-between rounded-t-3xl text-white">
        <div className='flex space-x-8'>
          <NavLink
          to="/swap"
          end
          className={({ isActive }) =>
            `hover:font-bold font-medium ${isActive ? 'text-white border-b-2 border-blue-500' : ''}`
          }
        >
          Swap
        </NavLink>
        <NavLink
          to="/resolver"
          className={({ isActive }) =>
            `hover:font-bold font-medium ${isActive ? 'text-white border-b-2 border-blue-500' : ''}`
          }
        >
          Resolver List
        </NavLink>
        </div>
        <ConnectButton
          connectText="Connect Wallet"
          connectedText={`Connected: ${currentAccount?.address.slice(0, 6)}…`}
          className="rounded-lg"
        />
      </nav>
      <main className='p-8'>
        <Routes>
          <Route path="/" element={<Working />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/resolver" element={<ResolverListPage />} />
          <Route path="/resolver/:id" element={<ResolverDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;