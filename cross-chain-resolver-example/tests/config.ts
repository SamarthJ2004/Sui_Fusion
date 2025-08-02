import {z} from 'zod'
import Sdk from '@1inch/cross-chain-sdk'
import * as process from 'node:process'

const bool = z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean())

const ConfigSchema = z.object({
    SRC_CHAIN_RPC: z.string().url(),
    DST_CHAIN_RPC: z.string().url(),
    SRC_CHAIN_CREATE_FORK: bool.default('false'),    // since fork already from tenderly
    DST_CHAIN_CREATE_FORK: bool.default('false')
})


const fromEnv = ConfigSchema.parse(process.env)

export const config = {
    chain: {
        // using only source got both source and destination
        source: {
            chainId: Sdk.NetworkEnum.COINBASE,
            url: fromEnv.SRC_CHAIN_RPC,
            createFork: false,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0x4200000000000000000000000000000000000006',
            ownerPrivateKey: 'ebb2716cd27368f00c751d1b9a9117ac3022ba834d44754820cdd628464f8048',
            tokens: {
                USDC: {
                    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                    donor: '0x4a9973aD4DbB8A968ca5A5c8d2b13937dEB0f928'
                }
            }
        }, 
        destination: {
            chainId: Sdk.NetworkEnum.ETHEREUM,
            url: fromEnv.SRC_CHAIN_RPC,
            createFork: fromEnv.SRC_CHAIN_CREATE_FORK,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDC: {
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0xd54F23BE482D9A58676590fCa79c8E43087f92fB'
                }
            }
        }, 
    }
} as const

export type ChainConfig = (typeof config.chain)['source' | 'destination']