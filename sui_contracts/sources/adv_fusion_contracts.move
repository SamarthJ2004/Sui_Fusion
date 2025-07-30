#[allow(lint(self_transfer))]
module fusion_contracts::adv_escrow_factory;
use sui::hash;
use sui::coin::{Self,Coin};
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::event;

// ERROR CODES
const E_SRC_ESCROW_ALREADY_EXIST: u64 = 0;
const E_SRC_ESCROW_DOES_NOT_EXIST: u64 = 1;
const E_NOT_AUTHORIZED_MAKER: u64 = 4;
const E_ALREADY_REDEEMED: u64 = 5;
const E_ALREADY_REFUNDED: u64 = 6;
const E_INADEQUATE_HASH_LEN: u64 = 7;
const E_INVALID_AMOUNT: u64 = 8;
const E_INVALID_TIMELOCK: u64 = 9;
const E_TIMELOCK_NOT_EXPIRED: u64 = 10;
const E_ORDER_NOT_FULLFILLED: u64 = 11;
const E_ORDER_ALREADY_EXISTS: u64 = 12;
const E_ORDER_DOES_NOT_EXISTS: u64 = 12;
const E_ORDER_REMDEEMED: u64 = 13;
const E_ORDER_REFUNDED: u64 = 13;

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
    redeemed: bool,
    refunded: bool,
}

#[allow(lint(coin_field))]
public struct Partial_Escrow<phantom T> has key, store {
    id: UID,
    secret_hash: vector<u8>,
    coins: Coin<SUI>,
    amount: u64,
    taker: Option<address>
}

public struct Order has key,store {
    id: UID,
    intent_announcer: address,
    maker_resolver: address,
    secret_hash: vector<u8>,
    total_amount: u64,
    filled_amount: u64,
    timelock: u64,
    completed: bool,
    redeemed: bool,
    refunded: bool,
}

/// Global storage for src and destination escrows diffently so that the same hash problem wont occur
public struct EscrowStore has key, store {
    id: UID,
    orders: Table<vector<u8>, Order>,
    fills: Table<ID, vector<ID>>,
    src_escrows: Table<vector<u8>, Escrow<SUI>>,
    dst_escrows: Table<ID, Partial_Escrow<SUI>>,
}

/// Storage automatically initialized at deployment
fun init(ctx: &mut TxContext) {
    let store = EscrowStore {
        id: object::new(ctx),
        orders: table::new(ctx),
        fills: table::new(ctx),
        src_escrows: table::new(ctx),
        dst_escrows: table::new(ctx),
    };
    transfer::public_share_object(store);
}

/// Storage initialised manually (for testing)
public fun create(ctx: &mut TxContext) {
    let store = EscrowStore {
        id: object::new(ctx),
        orders: table::new(ctx),
        fills: table::new(ctx),
        src_escrows: table::new(ctx),
        dst_escrows: table::new(ctx),
    };
    transfer::public_share_object(store);
}

/// the resolver places a new order for partial‐fill swaps
public fun place_order(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    intent_announcer: address,
    total_amount: u64,
    timelock: u64,
    ctx: &mut TxContext,
) {
    assert!(!store.orders.contains(secret_hash), E_ORDER_ALREADY_EXISTS);
    let uid = object::new(ctx);
    let order = Order {
        id: uid,
        intent_announcer, 
        maker_resolver: tx_context::sender(ctx),
        secret_hash: copy (secret_hash),
        total_amount,
        filled_amount: 0,
        timelock,
        completed: false,
        refunded: false,
        redeemed: false,
    };
    let order_raw_id = object::id(&order);
    event::emit(OrderCreated {
        id: order_raw_id,
        intent_announcer,
        maker_resolver: tx_context::sender(ctx),
        secret_hash,
        total_amount,
        timelock,
    });
    table::add(&mut store.orders, copy (secret_hash), order);
    table::add(&mut store.fills, order_raw_id, vector::empty());
}

/// various resolvers fill a partial order by locking funds: dst escrow only
public fun fill_order(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    fill_amount: u64,
    coins: Coin<SUI>,
    ctx: &mut TxContext,
) {
    assert!(secret_hash.length() == 32, E_INADEQUATE_HASH_LEN);
    assert!(fill_amount > 0, E_INVALID_AMOUNT);
    assert!(store.orders.contains(secret_hash), E_ORDER_DOES_NOT_EXISTS);
    let order_ref = table::borrow_mut(&mut store.orders, secret_hash);
    assert!(!order_ref.completed, 0);
    let remaining = order_ref.total_amount - order_ref.filled_amount;
    assert!(fill_amount <= remaining, 1);

    order_ref.filled_amount = order_ref.filled_amount + fill_amount;
    if (order_ref.filled_amount == order_ref.total_amount) {
        order_ref.completed = true;
    };

    // lock fill_amount into escrow leg
    let escrow_id = object::new(ctx);
    let taker = tx_context::sender(ctx);
    let escrow = Partial_Escrow<SUI> {
        id: escrow_id,
        secret_hash,
        coins,
        amount: fill_amount,
        taker: option::some(taker),
    };
    let escrow_raw_id = object::id(&escrow);
    event::emit(Fill_DstEscrowCreated {
        id: escrow_raw_id,
        filler_resolver: tx_context::sender(ctx),
        amount: fill_amount,
        secret_hash,
    });
    table::add(&mut store.dst_escrows, escrow_raw_id, escrow);

    let fills = table::borrow_mut(&mut store.fills, object::id(order_ref));
    vector::push_back(fills, escrow_raw_id);
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

/// Redeem funds given preimage: Src => Resolver, Dst => User
/// the share is 0-100 and to be passed by the relayer
public entry fun redeem(store: &mut EscrowStore, secret: vector<u8>, is_src: bool, share: u64, ctx: &mut TxContext) {
    let secret_hash = hash::keccak256(&secret);

    if (is_src) {
        assert!(store.src_escrows.contains(secret_hash), E_SRC_ESCROW_DOES_NOT_EXIST);
        let escrow = table::borrow_mut(&mut store.src_escrows, secret_hash);
        assert!(!escrow.redeemed, E_ALREADY_REDEEMED);
        assert!(!escrow.refunded, E_ALREADY_REFUNDED);
        escrow.redeemed = true;
        let taker = tx_context::sender(ctx);

        assert!(!(escrow.min_swap_amount <= coin::value(&escrow.coins)), E_ORDER_NOT_FULLFILLED);
        let taker_coins = coin::split(&mut escrow.coins, share, ctx);
        event::emit(Src_Redeemed{id: object::id(escrow), secret, taker, amount: coin::value(&taker_coins)});
        transfer::public_transfer(taker_coins, taker);
    } else {
        assert!(store.orders.contains(secret_hash), E_ORDER_DOES_NOT_EXISTS);
        let order = table::borrow_mut(&mut store.orders, secret_hash);
        assert!(order.completed, E_ORDER_NOT_FULLFILLED);
        assert!(!order.redeemed, E_ORDER_REMDEEMED);
        assert!(!order.refunded, E_ORDER_REFUNDED);
        let order_id = object::id(order);

        let mut fills = table::remove(&mut store.fills, order_id);
        while (!fills.is_empty()) {
            let id = fills.pop_back();
            let Partial_Escrow {id , coins, ..} = table::remove(&mut store.dst_escrows, id);
            id.delete();
            transfer::public_transfer(coins, order.intent_announcer);
        };
        order.redeemed = true;
        event::emit(OrderRedeemed { id: order_id, secret, intent_announcer: order.intent_announcer });
    }
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

public struct Fill_DstEscrowCreated has copy, drop {
    id: ID,
    filler_resolver: address,
    amount: u64,
    secret_hash: vector<u8>
}

public struct OrderCreated has copy, drop {
    id: ID,
    intent_announcer: address,
    maker_resolver: address,
    secret_hash: vector<u8>,
    total_amount: u64,
    timelock: u64
}

public struct Src_Redeemed has copy, drop {
    id: ID,
    secret: vector<u8>,
    taker: address,
    amount: u64,
}

public struct Refunded has copy, drop {
    id: ID,
    taker: address,
    secret_hash: vector<u8>,
}

public struct OrderRedeemed has copy, drop {
    id: ID,
    secret: vector<u8>,
    intent_announcer: address,
}