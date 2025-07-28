#[allow(lint(self_transfer))]
module fusion_contracts::escrow_factory;
use std::hash;
use sui::coin::Coin;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::event;

/// Struct representing a single escrow data
/// maker_resolver is the address of the resolver who creates the escrow
/// intent_announcer is the address of the user who wants to swap
/// taker is the address of the resolver who fills the order(src escrow) / user(dst escrow)
#[allow(lint(coin_field))]
public struct Escrow<phantom T> has key, store {
    id: UID,
    secret_hash: vector<u8>,
    coins: Coin<SUI>,
    amount: u64,
    timelock: u64,
    maker_resolver: address,
    intent_announcer: address,
    taker: Option<address>,
    redeemed: bool,
    refunded: bool,
}

/// Global storage for src and destination escrows diffently so that the same hash problem wont occur
public struct EscrowStore has key, store {
    id: UID,
    src_escrows: Table<vector<u8>, Escrow<SUI>>,
    dst_escrows: Table<vector<u8>, Escrow<SUI>>,
}

/// Storage automatically initialized at deployment
fun init(ctx: &mut TxContext) {
    let store = EscrowStore {
        id: object::new(ctx),
        src_escrows: table::new(ctx),
        dst_escrows: table::new(ctx),
    };
    transfer::public_transfer(store, tx_context::sender(ctx));
}

/// Storage initialised manually (for testing)
public fun create(ctx: &mut TxContext) {
    let store = EscrowStore {
        id: object::new(ctx),
        src_escrows: table::new(ctx),
        dst_escrows: table::new(ctx),
    };
    transfer::public_transfer(store, tx_context::sender(ctx));
}

/// Create source escrow: User funds are locked and the resolver receives the funds
public fun create_src_escrow(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    amount: u64,
    timelock: u64,
    coin: Coin<SUI>,
    intent_announcer: address,
    ctx: &mut TxContext,
) {
    let uid = object::new(ctx);
    let maker = tx_context::sender(ctx);

    let escrow = Escrow<SUI> {
        id: uid,
        secret_hash: copy (secret_hash),
        coins: coin,
        amount,
        timelock,
        maker_resolver: maker,
        taker: option::some(maker),
        intent_announcer,
        redeemed: false,
        refunded: false,
    };
    event::emit(SrcEscrowCreated {
        intent_announcer,
        resolver: maker,
        amount,
        timelock,
        id: object::id(&escrow),
        secret_hash,
    });
    table::add(&mut store.src_escrows, copy (secret_hash), escrow);
}

/// Create destination escrow: Resolver funds are locked and the user receives the funds
public fun create_dst_escrow(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    amount: u64,
    timelock: u64,
    coin: Coin<SUI>,
    intent_announcer: address,
    ctx: &mut TxContext,
) {
    let uid = object::new(ctx);
    let maker = tx_context::sender(ctx);

    let escrow = Escrow<SUI> {
        id: uid,
        secret_hash: copy (secret_hash),
        coins: coin,
        amount,
        timelock,
        maker_resolver: maker,
        taker: option::some(intent_announcer),
        intent_announcer,
        redeemed: false,
        refunded: false,
    };
    event::emit(DstEscrowCreated{

    });
    table::add(&mut store.dst_escrows, secret_hash, escrow);
}

/// Redeem funds given preimage: Src => Resolver, Dst => User
public entry fun redeem(store: &mut EscrowStore, secret: vector<u8>, is_src: bool, _ctx: &mut TxContext) {
    let secret_hash = hash::sha2_256(secret);
    let mut escrow = if (is_src) {
        table::remove(&mut store.src_escrows, secret_hash)
    } else {
        table::remove(&mut store.dst_escrows, secret_hash)
    };
    assert!(!escrow.redeemed, 2);
    assert!(!escrow.refunded, 3);
    escrow.redeemed = true;
    let taker = if (is_src) {
        event::emit(SrcRedeemed{});
        escrow.maker_resolver
    } else {
        event::emit(DstRedeemed{});
        escrow.intent_announcer
    };

    let Escrow {id  ,coins, ..} = escrow;
    id.delete();
    transfer::public_transfer(coins, taker);
}

/// Refund after timelock expiry: Src => User
public entry fun refund(store: &mut EscrowStore, secret_hash: vector<u8>, is_src: bool, ctx: &mut TxContext) {
    let mut escrow = if (is_src) {
        table::remove(&mut store.src_escrows, secret_hash)
    } else {
        table::remove(&mut store.dst_escrows, secret_hash)
    };
    
    let current_time = tx_context::epoch_timestamp_ms(ctx);
    assert!(current_time > escrow.timelock, 5);
    assert!(!escrow.redeemed, 6);
    assert!(!escrow.refunded, 7);
    escrow.refunded = true;
    let taker = if (is_src) {
        escrow.intent_announcer
    } else {
        escrow.maker_resolver
    };

    let Escrow {id, coins,..} = escrow;
    id.delete();

    transfer::public_transfer(coins, taker);
}

/// Maker side: Cancel source escrow if no matching destination escrow has been created
public entry fun cancel_src_escrow_if_unmatched(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    ctx: &mut TxContext,
) {
    // 1. Check if the source escrow exists and belongs to the caller
    assert!(table::contains(&store.src_escrows, secret_hash), 1);
    let src_escrow_ref = table::borrow(&store.src_escrows, secret_hash);
    assert!(tx_context::sender(ctx) == src_escrow_ref.maker_resolver, 2);

    // 2. Check if a corresponding destination escrow *does not* exist
    // This is the crucial condition for early cancellation.
    assert!(!table::contains(&store.dst_escrows, secret_hash), 3);

    // 3. Ensure the source escrow has not been redeemed or refunded
    assert!(!src_escrow_ref.redeemed, 4);
    assert!(!src_escrow_ref.refunded, 5);

    // 4. Remove the source escrow and transfer funds back to the maker
    let mut escrow = table::remove(&mut store.src_escrows, secret_hash);
    escrow.refunded = true; // Mark as refunded
    let taker= escrow.intent_announcer;
    transfer::public_transfer(escrow, taker);
}

// Define new error codes (e.g., in your module's constants)
// const E_SRC_ESCROW_DOES_NOT_EXIST: u64 = 100;
// const E_NOT_AUTHORIZED_MAKER: u64 = 101;
// const E_DST_ESCROW_ALREADY_EXISTS: u64 = 102; // Or E_MATCHING_ESCROW_FOUND
// const E_ALREADY_REDEEMED: u64 = 103;
// const E_ALREADY_REFUNDED: u64 = 104;

public struct SrcEscrowCreated has copy, drop {
    intent_announcer: address,
    resolver: address,
    amount: u64,
    timelock: u64,
    id: ID,
    secret_hash: vector<u8>
}

public struct DstEscrowCreated has copy, drop {

}

public struct SrcRedeemed has copy, drop {

}

public struct DstRedeemed has copy, drop {

}

public struct Refunded has copy, drop {

}