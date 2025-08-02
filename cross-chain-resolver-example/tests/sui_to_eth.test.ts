import 'dotenv/config'
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'

import { createServer, CreateServerReturnType } from 'prool'
import { anvil } from "prool/instances"

import { redeemEscrow, createSrcEscrow } from './sui_utils.js';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

import Sdk from '@1inch/cross-chain-sdk'
import {
    computeAddress,
    Interface,
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

const { Address, HashLock, TimeLocks, Immutables } = Sdk

jest.setTimeout(1000 * 60 * 20)

const SUI_USER_PRIVATE_KEY = process.env.SUI_USER_PRIVATE_KEY!;

const suiKeypairUser = Ed25519Keypair.fromSecretKey(Buffer.from(SUI_USER_PRIVATE_KEY, 'hex'));
const suiAddressUser = suiKeypairUser.getPublicKey().toSuiAddress();

//The EscrowFactory and the resolver contracts must be predeployed

// The user & resolver must be changed for sui to evm case 
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

    let dst: Chain
    // let dst: Chain

    let dstChainUser: Wallet
    let dstChainResolver: Wallet

    let dstFactory: EscrowFactory
    let dstResolverContract: Wallet

    let resolverInstance: Resolver


    //Needs Changes
    let dstTimestamp: bigint

    async function increaseTime(t: number): Promise<void> {
        await dst.provider.send('evm_increaseTime', [t])
    }

    beforeAll(async () => {
        // we are using base chain for both source and destination

        //Error - NOT WORKING as security deposit not provided
        
        dst = await initChain(config.chain.source); 


        // for evm side
        dstChainUser = new Wallet(userPk, dst.provider)
        dstChainResolver = new Wallet(resolverPk, dst.provider)

        dstFactory = new EscrowFactory(dst.provider, dst.escrowFactory)

        // funding the address in tenderly and approve to LOP

        // await src.provider.send("tenderly_setBalance", [
        //     userPPk,
        //     "0x56BC75E2D63100000", // = 0.1 ETH in hex
        // ]);
        // await srcChainUser.approveToken(
        //     config.chain.source.tokens.USDC.address,
        //     config.chain.source.limitOrderProtocol,
        //     MaxUint256
        // )

        // fund resolver for gas and approve factory
        await dstChainResolver.transfer(dst.resolver, parseEther('1'))
        await dstChainResolver.unlimitedApprove(config.chain.source.tokens.USDC.address, dst.escrowFactory)
        // dstTimestamp = BigInt((await dst.provider.getBlock('latest'))!.timestamp)

        await dstChainResolver.transferToken(
            config.chain.source.tokens.USDC.address, //token address
            dst.resolver, // resolver contract address
            parseUnits('1', 9) 
        );

        const usdcInterface = new Interface([
            'function approve(address spender, uint256 amount) returns (bool)'
        ]);
        resolverInstance = new Resolver(
            dst.resolver, // srcAddress == dstAddress [Resolver Contract]
            dst.resolver 
        );

        const approveCalldata = usdcInterface.encodeFunctionData('approve', [
            dst.escrowFactory, // Approve the factory
            MaxUint256 // Unlimited approval
        ]);

        const resolverInterface = new Interface(resolverContract.abi);

        await dstChainResolver.send({
            to: dst.resolver,
            data: resolverInterface.encodeFunctionData('arbitraryCalls', [
                [config.chain.source.tokens.USDC.address], // Target: USDC contract
                [approveCalldata] // Call: approve(factory, MaxUint256)
            ])
        });

        console.log('approved the factory with the resolver USDC');
    })

    // async function getBalances(
    //     srcToken: string
    // ): Promise<{ src: { user: bigint; resolver: bigint } }> {
    //     return {
    //         src: {
    //             user: await srcChainUser.tokenBalance(srcToken),
    //             resolver: await srcChainResolver.tokenBalance(srcToken)
    //         }
    //     }
    // }

    // afterAll(async () => {
    //     src.provider.destroy()
    //     dst.provider.destroy()
    //     await Promise.all([src.node?.stop(), dst.node?.stop()])
    // })

    // eslint-disable-next-line max-lines-per-function
    describe('Fill', () => {
        it('should swap SUI -> Base Ethereum USDC . Single fill only', async () => {
            // const initialBalances = await getBalances(
            //     config.chain.source.tokens.USDC.address
            // )

            // User creates order
            const secret = uint8ArrayToHex(randomBytes(32)) // note: use crypto secure random number in real world
             console.log("secret",secret)
            const hashLock = Sdk.HashLock.forSingleFill(secret);
            console.log('hashLock:', hashLock);
            // add this to supabase for frontend

            //SUI side order creation
            const hash = hashLock.toString();
            
            // console.log("Announcing order on the SUI chain")

            // const announce_Order = await announceStandardOrder(hash)
            // if (!announce_Order) throw new Error('announce_Order is undefined');
            //     const orderId = announce_Order.toString();
            //     console.log("user announced order on Sui chain ")
            //     console.log("OrderId : ",orderId);

            //Creating Src escrow on SUI
             const currentTime = BigInt(Math.floor(Date.now() / 1000));

             const timeLocks = TimeLocks.new({
                srcWithdrawal: 2n,           // 1 minute
                srcPublicWithdrawal: 3600n,   // 1 hour  
                srcCancellation: 7200n,       // 2 hours
                srcPublicCancellation: 7260n, // 2 hours 1 minute
                dstWithdrawal: 5n,           // 30 seconds
                dstPublicWithdrawal: 1800n,   // 30 minutes
                dstCancellation: 3600n        // 1 hour (MUST be < srcCancellation!)
            }).setDeployedAt(currentTime);
            console.log("createSrcEscrow calling for sui contract");
            const create_src_escrow = await createSrcEscrow({ preimage: hash });

            console.log("Src escrow created on the SUI chain",create_src_escrow)

            const resolverContractInstance = new Resolver(dst.resolver, dst.resolver);

            const orderHash = uint8ArrayToHex(randomBytes(32))

            const dstImmutables = Immutables.new({
                orderHash: orderHash,
                hashLock: hashLock,
                maker: new Address(await dstChainUser.getAddress()),
                taker: new Address(dst.resolver),
                token: new Address(config.chain.source.tokens.USDC.address),
                amount: parseUnits('2', 9), // 2 USDC
                safetyDeposit: parseEther('0.01'),
                timeLocks: timeLocks
            });
        
            console.log(dstImmutables);

            console.log("Deploying the destination on ETH");

            const {txHash: dstDepositHash, blockTimestamp: dstDeployedAt} = await dstChainResolver.send(
                resolverContractInstance.deployDst(dstImmutables)
            );

            console.log('DstDepositHash',dstDepositHash)
            console.log('DEployed destination escrow');


            const dstImplementation = await dstFactory.getDestinationImpl()
            const escrowFactory = new Sdk.EscrowFactory(new Address(dst.escrowFactory))
            const dstEscrowAddress = escrowFactory.getEscrowAddress(
                dstImmutables.withDeployedAt(dstDeployedAt).hash(),
                dstImplementation
            )

            console.log('Dst Escrow address ETH', dstEscrowAddress.toString())

            //  await increaseTime(10);

             await dstChainResolver.send(
                resolverContractInstance.withdraw('dst', dstEscrowAddress, secret, dstImmutables.withDeployedAt(dstDeployedAt))
            )

            console.log('withdrew succesffult for the user')

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