# 1Inch Fusion+ → Sui Cross‑Chain Swap Extension

This repository contains an extension to 1inch Fusion+ that enables atomic, HTLC‑based cross‑chain swaps between Ethereum (EVM) and Sui (Move) blockchains. It provides:

* **Ethereum HTLC** smart contract (Solidity) for ERC‑20 token locking.
* **Sui HTLC** Move contracts for native SUI (or any Coin<T>, later) locking.
* **Relayer** service (Node.js/TypeScript) to watch events and forward preimages.
* **Frontend UI** React for initiating and monitoring swaps.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Setup & Configuration](#setup--configuration)
4. Contracts
    1. [Ethereum HTLC](#ethereum-htlc)
    2. [Sui HTLC](#sui-htlc)
5. [Relayer Service](#relayer-service)
6. [Frontend UI](#optional-frontend-ui)
7. [Testing on Testnets](#testing-on-testnets)
8. [Deploying to Mainnet](#deploying-to-mainnet)
9. [Swap Flows](#swap-flows)
10. [Env Configuration](#env-configuration)
11. [Future Improvements](#future-improvements)

---

## Architecture Overview

```text
[Browser UI]           [Relayer Service]        [Blockchains]
     │                        │                        │
     │ 1. Initiate Swap       │                        │
     │───────────────────────▶│                        │
     │                        │                        │
     │                        │ 2a. Lock on Ethereum   │
     │                        │───────────────────────▶│ Ethereum HTLC
     │                        │                        │
     │                        │   2b. Lock on Sui      │
     │                        │───────────────────────▶│ Sui HTLC
     │                        │                        │
     │                        │ 3. Listen for redeem   │
     │                        │    events & forward    │
     │                        │    preimages           │
     │                        │ ◀───────────────────────┤
     │                        │                        │
     │                        │ 4. Redeem counterpart  │
     │                        │    contract            │
     │                        │───────────────────────▶│

```

---

## Prerequisites

* **Node.js**
* **npm**
* **pnpm**
* **Forge**
* **Sui CLI**
* **Git**

---

## Setup & Configuration

1. **Clone the repo**:

   ```bash
   git clone https://github.com/your-org/fusion-sui-swap.git
   cd fusion-sui-swap
   ```

2. **Install dependencies**:

   ```bash
   # Root
   npm install

   # Ethereum
   cd ethereum
   npm install

   # Sui
   cd ../sui
   npm install

   # Relayer
   cd ../relayer
   npm install

   # Frontend (optional)
   cd ../frontend
   npm install
   ```

3. **Configure environment** (see [Env Configuration](#env-configuration)).

---

## Ethereum HTLC

Located in `ethereum/contracts/HTLC.sol`.

### Features

* Lock ERC‑20 tokens with `hashlock` and `timelock`.
* `redeem(bytes32 preimage)` transfers to receiver and emits `Redeemed(preimage)`.
* `refund()` returns tokens to sender after expiry.

### Compile & Deploy

```bash
cd ethereum
npx hardhat compile
npx hardhat run scripts/deploy-htlc.js --network goerli
```

---

## Sui HTLC

Located in `sui/src/HTLC.move`.

### Features

* `initialize(sender, receiver, hashlock, timelock, amount)` creates HTLC resource.
* `redeem(preimage)` checks hash and transfers SUI; emits `PreimageRevealed`.
* `refund()` returns SUI to sender after timelock.

### Build & Publish

```bash
cd sui
sui client publish
```

---

## Relayer Service

Located in `relayer/`.

### Responsibilities

* Subscribe to Ethereum `Redeemed` events.
* Subscribe to Sui `PreimageRevealed` events.
* Call the counterparty contract’s `redeem(preimage)`.
* Optionally call `refund()` after timelocks.

### Run Locally

```bash
cd relayer
npm run start
```

---

## (Optional) Frontend UI

Located in `frontend/` (Next.js).

### Features

* Connect both **Ethereum** and **Sui** wallets.
* Initiate swaps with hashlock and timelock.
* Monitor swap status, timers, and allow manual redeem/refund.

### Start Dev Server

```bash
cd frontend
npm run dev
```

---

## Testing on Testnets

1. **Ethereum**: Goerli or Sepolia. Fund wallets with test ETH and test ERC‑20.
2. **Sui**: Sui Devnet. Use faucet to get SUI.
3. **Deploy** contracts on both chains:

   * Ethereum: `npx hardhat run scripts/deploy-htlc.js --network goerli`
   * Sui: `sui client publish`
4. **Run Relayer** and **Frontend**, perform end-to-end swap:

   * Initiate on one chain, respond on the other.

---

## Deploying to Mainnet

* Update **RPC endpoints** in `config.ts`.
* Redeploy **Ethereum HTLC** on mainnet, and use real ERC‑20 addresses (e.g., USDC).
* Publish **Sui HTLC** on Sui Mainnet.
* Update **.env** for `FUSION_PLUS_API_KEY`, `RPC_URL`, contract addresses.
* Run Relayer against mainnet endpoints.

---

## Swap Flows

### Ethereum → Sui (ETH first)

1. Alice generates `P` & `H = hash(P)` off-chain.
2. Alice locks tokens in Ethereum HTLC:

   ```js
   await htlcEth.initialize(bobSuiAddress, H, timelockEth, { value: amount });
   ```
3. Bob locks SUI in Sui HTLC using same `H` and `timelockSui < timelockEth`.
4. Alice calls `redeem(P)` on Sui HTLC → emits `PreimageRevealed`.
5. Relayer catches it → calls `redeem(P)` on Ethereum → completes swap.
6. Refund paths kick in after expirations if needed.

### Sui → Ethereum (SUI first)

Same logic, roles reversed.

---

## Env Configuration

Copy `.env.example` to `.env` in each folder and fill in:

* **ETH\_RPC\_URL**: Ethereum node URL
* **SUI\_RPC\_URL**: Sui node URL
* **PRIVATE\_KEY\_ETH**: Deployer wallet private key
* **PRIVATE\_KEY\_SUI**: Sui wallet key
* **FUSION\_PLUS\_API\_KEY**: (if using Fusion+ SDK)

---

## Future Improvements

* **Partial fills**: support multi‑redeem until balance is drained.
* **On‑chain resolver**: integrate Wormhole or LayerZero for trustless messaging.
* **UI enhancements**: gas estimators, swap quotes, analytics.
* **Multi-relayer network**: redundancy and high availability.