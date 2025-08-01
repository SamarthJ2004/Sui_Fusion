import { supabase } from '@/lib/supabase';
import { createSrcEscrow, createDstEscrow } from '@/lib/sui';
import { NextResponse } from 'next/server';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Resolver } from '@/lib/solidity_integration/resolver';

export async function POST(request) {
  try {
    const body = await request.json();
    const { currentAccount, secret_hash } = body;

    if (!currentAccount || !secret_hash) {
      return NextResponse.json({ error: 'Missing currentAccount or secret_hash' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Relayer_Data')
      .select('*')
      .eq('secret_hash', secret_hash)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    const { secret, amount_src, min_swap_amount, timelock, chain_src } = data;

    const statusLogger = (status) => console.log("STATUS:", status);
    const signAndExecuteTransactionBlock = useSignAndExecuteTransaction();

    // =======================
    const order = Sdk.CrossChainOrder.new(
      new Address(src.escrowFactory),
      {
        salt: Sdk.randBigInt(1000n),
        maker: new Address(await srcChainUser.getAddress()),
        makingAmount: parseUnits('100', 6),
        takingAmount: parseUnits('99', 6),
        makerAsset: new Address(config.chain.source.tokens.USDC.address),
        takerAsset: new Address(config.chain.destination.tokens.USDC.address)
      },
      {
        hashLock: Sdk.HashLock.forSingleFill(secret),
        timeLocks: Sdk.TimeLocks.new({
          srcWithdrawal: 10n, // 10sec finality lock for test
          srcPublicWithdrawal: 120n, // 2m for private withdrawal
          srcCancellation: 121n, // 1sec public withdrawal
          srcPublicCancellation: 122n, // 1sec private cancellation
          dstWithdrawal: 10n, // 10sec finality lock for test
          dstPublicWithdrawal: 100n, // 100sec private withdrawal
          dstCancellation: 101n // 1sec public withdrawal
        }),
        srcChainId,
        dstChainId,
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

    const resolverContract = new Resolver(src.resolver, dst.resolver);
    const fillAmount = order.makingAmount
    const { txHash: orderFillHash, blockHash: srcDeployBlock } = await srcChainResolver.send(
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
    // =======================

    if (chain_src == "ethereum") {
      // src eth call

      await createDstEscrow({
        currentAccount,
        preimage: secret,
        amount: amount_src,
        minSwap: min_swap_amount,
        timelock,
        setStatus: statusLogger,
        signAndExecuteTransactionBlock,
      });
    } else {
      await createSrcEscrow({
        currentAccount,
        preimage: secret,
        amount: amount_src,
        minSwap: min_swap_amount,
        timelock,
        setStatus: statusLogger,
        signAndExecuteTransactionBlock,
      });

      // dst eth call 
    }

    // Update statuses
    await supabase.from('Relayer_Data').update({
      escrow_creator: currentAccount.address,
      src_escrow_status: 'deployed_locked',
      dst_escrow_status: 'funded',
      status: 'secret_revealed',
    }).eq('secret_hash', secret_hash);

    return NextResponse.json({ secret: secret });
  } catch (err) {
    console.error("Resolver POST error:", err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
