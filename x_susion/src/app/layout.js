// src/app/layout.js
"use client"
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import Navbar from '@/components/Navbar';
import "@mysten/dapp-kit/dist/index.css";

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
      <body className='bg-black w-full h-full'>
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider networks={networks} defaultNetwork="devnet">
            <WalletProvider autoConnect>
              <div className="items-center justify-start py-8">
                <div className="flex flex-col bg-gray-600 w-full max-w-6xl mx-auto rounded-3xl relative">
                  <Navbar />
                  <main className="p-8">{children}</main>
                </div>
              </div>
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
