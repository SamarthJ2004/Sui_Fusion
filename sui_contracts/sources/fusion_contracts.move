#[allow(lint(self_transfer))]
module fusion_contracts::escrow_factory;
use sui::hash;
use sui::coin::{Self,Coin};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::event;

// ERROR CODES
const E_SRC_ESCROW_ALREADY_EXIST: u64 = 0;
const E_SRC_ESCROW_DOES_NOT_EXIST: u64 = 1;
const E_DST_ESCROW_ALREADY_EXISTS: u64 = 2;
const E_DST_ESCROW_DOES_NOT_EXISTS: u64 = 3;
const E_NOT_AUTHORIZED_MAKER: u64 = 4;
const E_ALREADY_REDEEMED: u64 = 5;
const E_ALREADY_REFUNDED: u64 = 6;
const E_INADEQUATE_HASH_LEN: u64 = 7;
const E_INVALID_AMOUNT: u64 = 8;
const E_INVALID_TIMELOCK: u64 = 9;
const E_TIMELOCK_NOT_EXPIRED: u64 = 10;
const E_ORDER_NOT_FULLFILLED: u64 = 11;

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
    min_swap_amount: u64,
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
    transfer::public_share_object(store);
}

/// Storage initialised manually (for testing)
public fun create(ctx: &mut TxContext) {
    let store = EscrowStore {
        id: object::new(ctx),
        src_escrows: table::new(ctx),
        dst_escrows: table::new(ctx),
    };
    transfer::public_share_object(store);
}

/// Create source escrow: User funds are locked and the resolver receives the funds
public fun create_src_escrow(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    amount: u64,
    min_swap_amount: u64,
    timelock: u64,
    coin: Coin<SUI>,
    intent_announcer: address,
    ctx: &mut TxContext,
) {
    assert!(secret_hash.length() == 32, E_INADEQUATE_HASH_LEN);
    assert!(timelock > 0,E_INVALID_TIMELOCK);
    assert!(amount > 0, E_INVALID_AMOUNT);
    assert!(!store.src_escrows.contains(secret_hash), E_SRC_ESCROW_ALREADY_EXIST);
    let uid = object::new(ctx);
    let maker = tx_context::sender(ctx);

    let escrow = Escrow<SUI> {
        id: uid,
        secret_hash: copy (secret_hash),
        coins: coin,
        amount,
        min_swap_amount,
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
        min_swap_amount,
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
    min_swap_amount: u64,
    timelock: u64,
    coin: Coin<SUI>,
    intent_announcer: address,
    ctx: &mut TxContext,
) {
    assert!(secret_hash.length() == 32, E_INADEQUATE_HASH_LEN);
    assert!(timelock > 0,E_INVALID_TIMELOCK);
    assert!(amount > 0, E_INVALID_AMOUNT);
    assert!(min_swap_amount > 0, E_INVALID_AMOUNT);
    assert!(!store.dst_escrows.contains(secret_hash),E_DST_ESCROW_ALREADY_EXISTS);
    let uid = object::new(ctx);
    let maker = tx_context::sender(ctx);

    let escrow = Escrow<SUI> {
        id: uid,
        secret_hash: copy (secret_hash),
        coins: coin,
        amount,
        min_swap_amount,
        timelock,
        maker_resolver: maker,
        taker: option::some(intent_announcer),
        intent_announcer,
        redeemed: false,
        refunded: false,
    };
    event::emit(DstEscrowCreated{
        id: object::id(&escrow),
        secret_hash,
        amount,
        min_swap_amount,
        timelock, 
        resolver:maker,
        intent_announcer 
    });
    table::add(&mut store.dst_escrows, secret_hash, escrow);
}

/// Redeem funds given preimage: Src => Resolver, Dst => User
public entry fun redeem(store: &mut EscrowStore, secret: vector<u8>, is_src: bool, _ctx: &mut TxContext) {
    let secret_hash = hash::keccak256(&secret);
    let mut escrow = if (is_src) {
        assert!(store.src_escrows.contains(secret_hash), E_SRC_ESCROW_DOES_NOT_EXIST);
        table::remove(&mut store.src_escrows, secret_hash)
    } else {
        assert!(store.dst_escrows.contains(secret_hash), E_DST_ESCROW_DOES_NOT_EXISTS);
        table::remove(&mut store.dst_escrows, secret_hash)
    };
    assert!(!escrow.redeemed, E_ALREADY_REDEEMED);
    assert!(!escrow.refunded, E_ALREADY_REFUNDED);
    escrow.redeemed = true;
    let taker = if (is_src) {
        escrow.maker_resolver
    } else {
        escrow.intent_announcer
    };

    event::emit(Redeemed{id: object::id(&escrow), secret_hash, is_src:true, taker});

    let Escrow {id  ,coins, min_swap_amount,..} = escrow;
    assert!(!(min_swap_amount <= coin::value(&coins)), E_ORDER_NOT_FULLFILLED);
    id.delete();
    transfer::public_transfer(coins, taker);
}

/// Refund after timelock expiry: Src => User
public entry fun refund(store: &mut EscrowStore, secret_hash: vector<u8>, ctx: &mut TxContext) {
    assert!(!store.src_escrows.contains(secret_hash), E_SRC_ESCROW_DOES_NOT_EXIST);
    let mut escrow = table::remove(&mut store.src_escrows, secret_hash);
    
    let current_time = tx_context::epoch_timestamp_ms(ctx);
    assert!(current_time > escrow.timelock, E_TIMELOCK_NOT_EXPIRED);
    assert!(!escrow.redeemed, E_ALREADY_REDEEMED);
    assert!(!escrow.refunded, E_ALREADY_REFUNDED);
    escrow.refunded = true;
    let taker = escrow.intent_announcer;

    event::emit(Refunded{
        id: object::id(&escrow),
        secret_hash,
        taker,
    });

    let Escrow {id, coins,..} = escrow;
    id.delete();

    transfer::public_transfer(coins, taker);
}

public struct SrcEscrowCreated has copy, drop {
    intent_announcer: address,
    resolver: address,
    amount: u64,
    min_swap_amount: u64,
    timelock: u64,
    id: ID,
    secret_hash: vector<u8>
}

public struct DstEscrowCreated has copy, drop {
    intent_announcer: address,
    resolver: address,
    amount: u64,
    min_swap_amount: u64,
    timelock: u64,
    id: ID,
    secret_hash: vector<u8>
}

public struct Redeemed has copy, drop {
    id: ID,
    secret_hash: vector<u8>,
    is_src: bool,
    taker: address,
}

public struct Refunded has copy, drop {
    id: ID,
    taker: address,
    secret_hash: vector<u8>,
}