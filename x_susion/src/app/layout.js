// src/app/layout.js
"use client"
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient();

const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

// export const metadata = {
//   title: 'Your Sui dApp',
//   description: 'Built with Next.js App Router',
// };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider networks={networks} defaultNetwork="devnet">
            <WalletProvider autoConnect>
              <div className="flex flex-col bg-gray-600 w-[1200px] m-auto rounded-3xl">
                <Navbar />
                <main className="p-8">{children}</main>
              </div>
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
