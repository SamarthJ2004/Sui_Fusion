// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@mysten/dapp-kit/dist/index.css";
import "./index.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Set up network config
const networks = {
  devnet: { url: getFullnodeUrl("devnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="devnet">
        <WalletProvider autoConnect>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
