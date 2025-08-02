import 'dotenv/config'
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'

import { createServer, CreateServerReturnType } from 'prool'
import { anvil } from "prool/instances"

import { createDstEscrow, redeemEscrow, refundEscrow } from './sui_utils.js';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

import Sdk from '@1inch/cross-chain-sdk'
import {
    computeAddress,
    ContractFactory,
    JsonRpcProvider,
    MaxUint256,
    parseEther,
    parseUnits,
    randomBytes,
    Wallet as SignerWallet
} from 'ethers'
import { uint8ArrayToHex, UINT_40_MAX } from '@1inch/byte-utils'
import assert from 'node:assert';
import { ChainConfig, config } from './config.ts'
import { Wallet } from './wallet.ts'
import { Resolver } from './resolver.ts'
import { EscrowFactory } from './escrow-factory.ts'
import factoryContract from '../dist/contracts/TestEscrowFactory.sol/TestEscrowFactory.json'
import resolverContract from '../dist/contracts/Resolver.sol/Resolver.json'

const { Address } = Sdk

jest.setTimeout(1000 * 60 * 20)

const SUI_USER_PRIVATE_KEY = process.env.SUI_USER_PRIVATE_KEY!;

const suiKeypairUser = Ed25519Keypair.fromSecretKey(Buffer.from(SUI_USER_PRIVATE_KEY, 'hex'));
const suiAddressUser = suiKeypairUser.getPublicKey().toSuiAddress();

// for evm side
const userPk = '4fc0d3cb12d3f14ad402871c561ee82a548f1f628b66ea2c7fc079a6d0164f72'
const userPPk = '0xDe1C59511ad34F6B09Fa31657430271bCB3581fc'
const resolverPk = '0x82d7fe275b77971877b5ab0bf8c3e5cca62156025a5d3e67c535f51c99a955fe'
const resolverPPk = '0x77d6A9B27C435e88B29ED2F92b9EE99d7E1160D6'

// eslint-disable-next-line max-lines-per-function
describe('Resolving example', () => {
    const srcChainId = config.chain.source.chainId
    const dstChainId = config.chain.destination.chainId

    type Chain = {
        node?: CreateServerReturnType | undefined
        provider: JsonRpcProvider
        escrowFactory: string
        resolver: string
    }

    let src: Chain
    // let dst: Chain

    let srcChainUser: Wallet
    let srcChainResolver: Wallet

    let srcFactory: EscrowFactory
    let srcResolverContract: Wallet

    let srcTimestamp: bigint

    async function increaseTime(t: number): Promise<void> {
        await src.provider.send('evm_increaseTime', [t])
    }

    beforeAll(async () => {
        src = await initChain(config.chain.source);

        // for evm side
        srcChainUser = new Wallet(userPk, src.provider)
        srcChainResolver = new Wallet(resolverPk, src.provider)

        srcFactory = new EscrowFactory(src.provider, src.escrowFactory)

        // funding the address in tenderly and approve to LOP

        // await src.provider.send("tenderly_setBalance", [
        //     userPPk,
        //     "0x56BC75E2D63100000", // = 0.1 ETH in hex
        // ]);
        await srcChainUser.approveToken(
            config.chain.source.tokens.USDC.address,
            config.chain.source.limitOrderProtocol,
            MaxUint256
        )

        // fund resolver for gas and approve factory
        await srcChainResolver.transfer(src.resolver, parseEther('1'))
        await srcChainResolver.unlimitedApprove(config.chain.source.tokens.USDC.address, src.escrowFactory)
        srcTimestamp = BigInt((await src.provider.getBlock('latest'))!.timestamp)
    })

    async function getBalances(
        srcToken: string
    ): Promise<{ src: { user: bigint; resolver: bigint } }> {
        return {
            src: {
                user: await srcChainUser.tokenBalance(srcToken),
                resolver: await srcChainResolver.tokenBalance(srcToken)
            }
        }
    }

    // afterAll(async () => {
    //     src.provider.destroy()
    //     dst.provider.destroy()
    //     await Promise.all([src.node?.stop(), dst.node?.stop()])
    // })

    // eslint-disable-next-line max-lines-per-function
    // describe('Fill', () => {
    //     it('should swap Base Ethereum USDC -> SUI . Single fill only', async () => {
    //         const initialBalances = await getBalances(
    //             config.chain.source.tokens.USDC.address
    //         )

    //         // User creates order
    //         const secret = uint8ArrayToHex(randomBytes(32)) // note: use crypto secure random number in real world
    //         const hashLock = Sdk.HashLock.forSingleFill(secret);
    //         console.log('hashLock:', hashLock);
    //         // add this to supabase for frontend

    //         const order = Sdk.CrossChainOrder.new(
    //             new Address(src.escrowFactory),
    //             {
    //                 salt: Sdk.randBigInt(1000n),
    //                 maker: new Address(await srcChainUser.getAddress()),
    //                 makingAmount: parseUnits('2', 6),
    //                 takingAmount: parseUnits('4', 6),
    //                 makerAsset: new Address(config.chain.source.tokens.USDC.address),
    //                 takerAsset: new Address(config.chain.source.tokens.USDC.address)
    //             },
    //             {
    //                 hashLock: hashLock,
    //                 timeLocks: Sdk.TimeLocks.new({
    //                     srcWithdrawal: 10n, // 10sec finality lock for test
    //                     srcPublicWithdrawal: 120n, // 2m for private withdrawal
    //                     srcCancellation: 121n, // 1sec public withdrawal
    //                     srcPublicCancellation: 122n, // 1sec private cancellation
    //                     dstWithdrawal: 10n, // 10sec finality lock for test
    //                     dstPublicWithdrawal: 100n, // 100sec private withdrawal
    //                     dstCancellation: 101n // 1sec public withdrawal
    //                 }),
    //                 srcChainId,
    //                 dstChainId, //todo: change to srcChainId
    //                 srcSafetyDeposit: parseEther('0.001'),
    //                 dstSafetyDeposit: parseEther('0.001')
    //             },
    //             {
    //                 auction: new Sdk.AuctionDetails({
    //                     initialRateBump: 0,
    //                     points: [],
    //                     duration: 120n,
    //                     startTime: srcTimestamp
    //                 }),
    //                 whitelist: [
    //                     {
    //                         address: new Address(src.resolver),
    //                         allowFrom: 0n
    //                     }
    //                 ],
    //                 resolvingStartTime: 0n
    //             },
    //             {
    //                 nonce: Sdk.randBigInt(UINT_40_MAX),
    //                 allowPartialFills: false,
    //                 allowMultipleFills: false
    //             }
    //         )

    //         const signature = await srcChainUser.signOrder(srcChainId, order)
    //         const orderHash = order.getOrderHash(srcChainId)

    //         const orderid = orderHash.toString();
    //         console.log(`[${srcChainId}]`, `Filling order ${orderHash}`)

    //         const resolverContract = new Resolver(src.resolver, src.resolver) // resolver is same for both src and dst contracts

    //         const fillAmount = order.makingAmount
    //         const { txHash: orderFillHash, blockHash: srcDeployBlock } = await srcChainResolver.send(
    //             resolverContract.deploySrc(
    //                 srcChainId,
    //                 order,
    //                 signature,
    //                 Sdk.TakerTraits.default()
    //                     .setExtension(order.extension)
    //                     .setAmountMode(Sdk.AmountMode.maker)
    //                     .setAmountThreshold(order.takingAmount),
    //                 fillAmount
    //             )
    //         )
    //         console.log(`[${srcChainId}]`, `Order ${orderHash} filled for ${fillAmount} in tx ${orderFillHash}`)

    //         const srcEscrowEvent = await srcFactory.getSrcDeployEvent(srcDeployBlock)
    //         console.log(`[${srcChainId}]`, `Source escrow created`)

    //         //SUI Chain logic
    //         const hash = hashLock.toString();
    //         console.log("createDstEscrow calling for sui contract");
    //         const create_dst_escrow = await createDstEscrow({ preimage: hash })

    //         console.log("Dst Escrow Id: ", create_dst_escrow);
    //         console.log("==============Dst Escrow created on the SUI chain=================")

    //         const ESCROW_SRC_IMPLEMENTATION = await srcFactory.getSourceImpl()
    //         const srcEscrowAddress = new Sdk.EscrowFactory(new Address(src.escrowFactory)).getSrcEscrowAddress(
    //             srcEscrowEvent[0],
    //             ESCROW_SRC_IMPLEMENTATION
    //         )


    //         await increaseTime(11)

    //         console.log("claiming funds on the destination chain SUI")
    //         await redeemEscrow({ preimage: hash, isSource: false });

           

    //         console.log("claimed funds on the destination chain SUI")

    //         // Withdraw funds from src escrow to resolver
    //         const { txHash: resolverWithdrawHash } = await srcChainResolver.send(
    //             resolverContract.withdraw('src', srcEscrowAddress, secret, srcEscrowEvent[0])
    //         )
    //         console.log(
    //             `[${srcChainId}]`,
    //             `Withdrew funds for resolver from ${srcEscrowAddress} to ${src.resolver} in tx ${resolverWithdrawHash}`
    //         )

    //         const resultBalances = await getBalances(
    //             config.chain.source.tokens.USDC.address
    //         )

    //         // user transferred funds to resolver on source chain
    //         expect(initialBalances.src.user - resultBalances.src.user).toBe(order.makingAmount)
    //         // expect(resultBalances.src.resolver - initialBalances.src.resolver).toBe(order.makingAmount)
    //     }) 
    // })


    describe('Cancel', () => {
        it('should cancel swap Base USDC -> SUI', async () => {

            // User creates order
            const secret = uint8ArrayToHex(randomBytes(32)) // note: use crypto secure random number in real world
            const hashLock = Sdk.HashLock.forSingleFill(secret);
            console.log('hashLock:', hashLock);
            // add this to supabase for frontend

            const order = Sdk.CrossChainOrder.new(
                new Address(src.escrowFactory),
                {
                    salt: Sdk.randBigInt(1000n),
                    maker: new Address(await srcChainUser.getAddress()),
                    makingAmount: parseUnits('2', 6),
                    takingAmount: parseUnits('4', 6),
                    makerAsset: new Address(config.chain.source.tokens.USDC.address),
                    takerAsset: new Address(config.chain.source.tokens.USDC.address)
                },
                {
                    hashLock: hashLock,
                    timeLocks: Sdk.TimeLocks.new({
                        srcWithdrawal: 10n, // 10sec finality lock for test
                        srcPublicWithdrawal: 12n, // 2m for private withdrawal
                        srcCancellation: 14n, // 1sec public withdrawal
                        srcPublicCancellation: 16n, // 1sec private cancellation
                        dstWithdrawal: 10n, // 10sec finality lock for test
                        dstPublicWithdrawal: 100n, // 100sec private withdrawal
                        dstCancellation: 101n // 1sec public withdrawal
                    }),
                    srcChainId,
                    dstChainId, //todo: change to srcChainId
                    srcSafetyDeposit: parseEther('0.001'),
                    dstSafetyDeposit: parseEther('0.001')
                },
                {
                    auction: new Sdk.AuctionDetails({
                        initialRateBump: 0,
                        points: [],
                        duration: 120n,
                        startTime: srcTimestamp
                    }),
                    whitelist: [
                        {
                            address: new Address(src.resolver),
                            allowFrom: 0n
                        }
                    ],
                    resolvingStartTime: 0n
                },
                {
                    nonce: Sdk.randBigInt(UINT_40_MAX),
                    allowPartialFills: false,
                    allowMultipleFills: false
                }
            )

            const signature = await srcChainUser.signOrder(srcChainId, order)
            const orderHash = order.getOrderHash(srcChainId)
            // Resolver fills order
            const resolverContract = new Resolver(src.resolver, src.resolver)

            console.log(`[${srcChainId}]`, `Filling order ${orderHash}`)

            const fillAmount = order.makingAmount
            const {txHash: orderFillHash, blockHash: srcDeployBlock} = await srcChainResolver.send(
                resolverContract.deploySrc(
                    srcChainId,
                    order,
                    signature,
                    Sdk.TakerTraits.default()
                        .setExtension(order.extension)
                        .setAmountMode(Sdk.AmountMode.maker)
                        .setAmountThreshold(order.takingAmount),
                    fillAmount
                )
            )

            console.log(`[${srcChainId}]`, `Order ${orderHash} filled for ${fillAmount} in tx https://base.blockscout.com/tx/${orderFillHash}`)

           const srcEscrowEvent = await srcFactory.getSrcDeployEvent(srcDeployBlock);
    console.log(`[${srcChainId}]`, `Source escrow created`);

            
    //SUI Chain logic
    const hash = hashLock.toString();
    console.log("createDstEscrow calling for sui contract");
    const create_dst_escrow = await createDstEscrow({ preimage: hash });

    console.log("Dst Escrow Id: ", create_dst_escrow);
    console.log(
      "==============Dst Escrow created on the SUI chain================="
    );

    const ESCROW_SRC_IMPLEMENTATION = await srcFactory.getSourceImpl();
    const srcEscrowAddress = new Sdk.EscrowFactory(
      new Address(src.escrowFactory)
    ).getSrcEscrowAddress(srcEscrowEvent[0], ESCROW_SRC_IMPLEMENTATION);

    await increaseTime(20);

        //    await refundEscrow({ secretHash: hash})

            
            // user does not share secret, so cancel both escrows

            

            console.log(`[${srcChainId}]`, `Cancelling src escrow ${srcEscrowAddress}`)
            const {txHash: cancelSrcEscrow} = await srcChainResolver.send(
                resolverContract.cancel('src', srcEscrowAddress, srcEscrowEvent[0])
            )
            console.log(`[${srcChainId}]`, `Cancelled src escrow ${srcEscrowAddress} in tx https://base.blockscout.com/tx/${cancelSrcEscrow}`)
        })
    })

})




async function initChain(
    cnf: ChainConfig
): Promise<{ node?: CreateServerReturnType; provider: JsonRpcProvider; escrowFactory: string; resolver: string }> {
    const { provider } = await getProvider(cnf)
    const deployer = new SignerWallet(cnf.ownerPrivateKey, provider)

    // deploy EscrowFactory
    const escrowFactory = await deploy(
        factoryContract,
        [
            cnf.limitOrderProtocol,
            cnf.wrappedNative, // feeToken,
            Address.fromBigInt(0n).toString(), // accessToken,
            deployer.address, // owner
            60 * 30, // src rescue delay
            60 * 30 // dst rescue delay
        ],
        provider,
        deployer
    )
    console.log(`[${cnf.chainId}]`, `Escrow factory contract deployed to`, escrowFactory)

    // deploy Resolver contract
    const resolver = await deploy(
        resolverContract,
        [
            escrowFactory,
            cnf.limitOrderProtocol,
            computeAddress(resolverPk) // resolver as owner of contract
        ],
        provider,
        deployer
    )
    console.log(`[${cnf.chainId}]`, `Resolver contract deployed to`, resolver)

    return { provider, resolver, escrowFactory }
}

async function getProvider(cnf: ChainConfig): Promise<{ node?: CreateServerReturnType; provider: JsonRpcProvider }> {
    if (!cnf.createFork) {
        return {
            provider: new JsonRpcProvider(cnf.url, cnf.chainId, {
                cacheTimeout: -1,
                staticNetwork: true
            })
        }
    }

    const node = createServer({
        instance: anvil({ forkUrl: cnf.url, chainId: cnf.chainId }),
        limit: 1
    })
    await node.start()

    const address = node.address()
    assert(address)

    const provider = new JsonRpcProvider(`http://[${address.address}]:${address.port}/1`, cnf.chainId, {
        cacheTimeout: -1,
        staticNetwork: true
    })

    return {
        provider,
        node
    }
}

/**
 * Deploy contract and return its address
 */
async function deploy(
    json: { abi: any; bytecode: any },
    params: unknown[],
    provider: JsonRpcProvider,
    deployer: SignerWallet
): Promise<string> {
    const deployed = await new ContractFactory(json.abi, json.bytecode, deployer).deploy(...params)
    await deployed.waitForDeployment()

    return await deployed.getAddress()
}