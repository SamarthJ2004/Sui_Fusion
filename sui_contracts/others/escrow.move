#[allow(unused_type_parameter)]
module escrow::escrow;
use std::hash;
use sui::coin::Coin;
use sui::sui::SUI;
use sui::table::{Self, Table};

/// Struct representing a single escrow leg
public struct Escrow<phantom T> has key, store {
    id: UID,
    secret_hash: vector<u8>,
    amount: u64,
    timelock: u64,
    maker: address,
    taker: Option<address>,
    redeemed: bool,
    refunded: bool,
}

/// Orderbook entry for partial fills
public struct Order<phantom T> has key, store {
    id: UID,
    secret_hash: vector<u8>,
    total_amount: u64,
    filled_amount: u64,
    timelock: u64,
    maker: address,
    completed: bool,
}

/// Global storage
public struct EscrowStore has key, store {
    id: UID,
    escrows: Table<vector<u8>, Escrow<SUI>>,
    orders: Table<vector<u8>, Order<SUI>>,
}

fun init(ctx: &mut TxContext) {
    let store = EscrowStore {
        id: object::new(ctx),
        escrows: table::new(ctx),
        orders: table::new(ctx),
    };
    transfer::public_transfer(store, tx_context::sender(ctx));
}

/// Place a new order for partial‐fill swaps
public fun place_order<T: store>(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    total_amount: u64,
    timelock: u64,
    ctx: &mut TxContext,
) {
    let uid = object::new(ctx);
    let maker = tx_context::sender(ctx);
    let order = Order<SUI> {
        id: uid,
        secret_hash: copy (secret_hash),
        total_amount,
        filled_amount: 0,
        timelock,
        maker,
        completed: false,
    };
    table::add(&mut store.orders, copy (secret_hash), order);
}

/// Fill a partial order by locking funds
public fun fill_order<T: store>(
    store: &mut EscrowStore,
    mut secret_hash: vector<u8>,
    fill_amount: u64,
    _preimage: vector<u8>,
    coin: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let order_ref = table::borrow_mut(&mut store.orders, secret_hash);
    assert!(!order_ref.completed, 0);
    let remaining = order_ref.total_amount - order_ref.filled_amount;
    assert!(fill_amount <= remaining, 1);

    // lock fill_amount into escrow leg
    let escrow_id = object::new(ctx);
    let taker = tx_context::sender(ctx);
    let escrow_address = object::uid_to_address(&escrow_id);
    let escrow = Escrow<SUI> {
        id: escrow_id,
        secret_hash: copy (secret_hash),
        amount: fill_amount,
        timelock: order_ref.timelock,
        maker: order_ref.maker,
        taker: option::some(taker),
        redeemed: false,
        refunded: false,
    };
    vector::append(&mut secret_hash, vector::singleton(0));
    table::add(&mut store.escrows, secret_hash, escrow);

    order_ref.filled_amount = order_ref.filled_amount + fill_amount;
    if (order_ref.filled_amount == order_ref.total_amount) {
        order_ref.completed = true;
    };

    // withdraw tokens from taker
    transfer::public_transfer(coin, escrow_address);
}

/// Maker side: create source escrow
public fun create_src_escrow<T: store>(
    store: &mut EscrowStore,
    secret_hash: vector<u8>,
    amount: u64,
    timelock: u64,
    coin: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let uid = object::new(ctx);
    let maker = tx_context::sender(ctx);
    let escrow_address = object::uid_to_address(&uid);

    transfer::public_transfer(coin, escrow_address);
    let escrow = Escrow<SUI> {
        id: uid,
        secret_hash: copy (secret_hash),
        amount,
        timelock,
        maker,
        taker: option::none(),
        redeemed: false,
        refunded: false,
    };
    table::add(&mut store.escrows, copy (secret_hash), escrow);
}

/// Relayer/Resolver: create destination escrow
public fun create_dst_escrow(
    store: &mut EscrowStore,
    mut secret_hash: vector<u8>,
    amount: u64,
    timelock: u64,
    taker: address,
    coin: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let uid = object::new(ctx);
    let escrow_address = object::uid_to_address(&uid);
    let maker = table::borrow(&store.escrows, secret_hash).maker;
    let escrow = Escrow<SUI> {
        id: uid,
        secret_hash: copy (secret_hash),
        amount,
        timelock,
        maker,
        taker: option::some(taker),
        redeemed: false,
        refunded: false,
    };
    vector::append(&mut secret_hash, vector::singleton(1));
    table::add(&mut store.escrows, secret_hash, escrow);

    // withdraw collateral from taker to escrow
    transfer::public_transfer(coin, escrow_address);
}

/// Redeem funds given preimage
public entry fun redeem(store: &mut EscrowStore, secret: vector<u8>, ctx: &mut TxContext) {
    let secret_hash = hash::sha2_256(secret);
    let mut escrow = table::remove(&mut store.escrows, secret_hash);
    assert!(!escrow.redeemed, 2);
    assert!(!escrow.refunded, 3);
    assert!(tx_context::sender(ctx) == option::destroy_some(escrow.taker), 4);
    escrow.redeemed = true;
    // transfer escrowed coins to taker
    transfer::public_transfer(escrow, tx_context::sender(ctx));
}

/// Refund after timelock expiry
public entry fun refund(store: &mut EscrowStore, secret_hash: vector<u8>, ctx: &mut TxContext) {
    let mut escrow = table::remove(&mut store.escrows, secret_hash);
    let current_time = tx_context::epoch_timestamp_ms(ctx);
    assert!(current_time > escrow.timelock, 5);
    assert!(!escrow.redeemed, 6);
    assert!(!escrow.refunded, 7);
    escrow.refunded = true;
    // transfer back to maker
    transfer::public_transfer(escrow, tx_context::sender(ctx));
}
