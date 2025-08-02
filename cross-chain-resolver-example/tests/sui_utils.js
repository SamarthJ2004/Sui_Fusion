import { Transaction } from "@mysten/sui/transactions";
import { keccak256, toUtf8Bytes } from 'ethers';
import dotenv from "dotenv"
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

dotenv.config();

const encoder = new TextEncoder();

const PACKAGE_ID =
    "0x0718122369037f990541ccb0855b6ff140a9c06a10ce95cdc1ca849713eda32d";
const STORE_ID =
    "0xdb1323ea1212c28d5ebe34835e71eaf24db5a60c8853bb4744ff5ab509fc3eff";

const SUI_RESOLVER_PRIVATE_KEY = process.env.SUI_RESOLVER_PRIVATE_KEY;
const SUI_USER_PRIVATE_KEY = process.env.SUI_USER_PRIVATE_KEY;
const SUI_PACKAGE_ID  = process.env.PACKAGE_ID;

console.log("sui resolver key: ", SUI_RESOLVER_PRIVATE_KEY);

const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

const suiKeypairResolver = Ed25519Keypair.fromSecretKey(Buffer.from(SUI_RESOLVER_PRIVATE_KEY, 'hex'));
const suiAddressResolver = suiKeypairResolver.getPublicKey().toSuiAddress();

const suiKeypairUser = Ed25519Keypair.fromSecretKey(Buffer.from(SUI_USER_PRIVATE_KEY, 'hex'));
const suiAddressUser = suiKeypairUser.getPublicKey().toSuiAddress();

export async function createSrcEscrow({
    preimage,
}) {
    console.log("Creating source escrow…");
    const hashBytes = hexToU8Vector(keccak256(toUtf8Bytes(preimage)));

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [
        tx.pure("u64", BigInt(4 * 1e9)),
    ]);

    tx.moveCall({
        target: `${PACKAGE_ID}::escrow_factory::create_src_escrow`,
        arguments: [
            tx.object(STORE_ID),
            tx.pure.vector("u8", hashBytes),
            tx.pure("u64", BigInt(4 * 1e9)),
            tx.pure("u64", BigInt(2 * 1e9)),
            tx.pure("u64", BigInt(52653)),
            coin,
            tx.pure("address", suiAddressUser),
        ],
    });

    const res = await suiClient.signAndExecuteTransaction({
        signer: suiKeypairResolver,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true },
    });

    console.log('CREATED SRC ESCROW result:', res);
    return res.objectChanges?.find(change => change.type === 'created')?.objectId;
}

function hexToU8Vector(hexString) {
    return Array.from(Buffer.from(hexString.slice(2), 'hex'));
}

export async function createDstEscrow({preimage}) {
    console.log("Creating destination escrow…");
    const hashBytes = hexToU8Vector(keccak256(toUtf8Bytes(preimage)));

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [
        tx.pure("u64", BigInt(4 * 1e9)),
    ]);

    tx.moveCall({
        target: `${PACKAGE_ID}::escrow_factory::create_dst_escrow`,
        arguments: [
            tx.object(STORE_ID),
            tx.pure.vector("u8", hashBytes),
            tx.pure("u64", BigInt(2 * 1e9)),
            tx.pure("u64", BigInt(4 * 1e9)),
            tx.pure("u64", BigInt(15)),
            coin,
            tx.pure("address", suiAddressUser),
        ],
    });

    const res = await suiClient.signAndExecuteTransaction({
        signer: suiKeypairResolver,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true },
    });

    console.log('CREATED DST ESCROW result:', res);
    return res.objectChanges?.find(change => change.type === 'created')?.objectId;
}

export async function redeemEscrow({
    preimage,
    isSource,
}) {
    console.log("Redeeming escrow…");

    const hashBytes = Array.from(encoder.encode(preimage));
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::escrow_factory::redeem`,
        arguments: [
            tx.object(STORE_ID),
            tx.pure.vector("u8", hashBytes),
            tx.pure("bool", isSource),
        ],
    });

    const res = await suiClient.signAndExecuteTransaction({
        signer: suiKeypairResolver,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true },
    });

    console.log('claim_htlc result:', res);
    return res;
}

export async function refundEscrow({
    // currentAccount,
    secretHash,
    // setStatus,
    // signAndExecuteTransactionBlock,
}) {
    // if (!currentAccount) return setStatus("Connect wallet first");
    console.log("Refunding escrow…");
    const hashBytes = Array.from(encoder.encode(secretHash));

    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::escrow_factory::refund`,
        arguments: [
            tx.object(STORE_ID),
            tx.pure.vector("u8", hashBytes),
        ],
    });

    const res = await suiClient.signAndExecuteTransaction({
        signer: suiKeypairResolver,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true },
    });

     console.log('Refund Successful:', res);
    return res;

}
