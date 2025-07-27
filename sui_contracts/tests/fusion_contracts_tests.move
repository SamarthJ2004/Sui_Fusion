#[test_only]
module fusion_contracts::escrow_factory_test;

use sui::test_scenario;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use fusion_contracts::escrow_factory;
use std::unit_test::assert_eq;
use std::hash;

#[test]
fun test_create_src_escrow() {
    let oneinch_addr = @0x11111;
    let alice_addr = @0xAAAAA;
    let resolver_addr = @0xBBBBB;
    let secret = b"Some secret";
    let secret_hash = hash::sha2_256(secret);
    let mut ts = test_scenario::begin(oneinch_addr);

    // Mint test coins for Alice and Bob
    let alice_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    let resolver_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    transfer::public_transfer(alice_coin, alice_addr);
    transfer::public_transfer(resolver_coin, resolver_addr);

    // Initialize the escrow store
    escrow_factory::create(ts.ctx());
    
    ts.next_tx(alice_addr);

    let coin1 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin1), 100);
    ts.return_to_sender(coin1);

    ts.next_tx(resolver_addr);

    let coin2 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin2), 100);
    ts.return_to_sender(coin2);
    
    // Simulate Resolver creating a source escrow
    // (You would call your create_src_escrow function here)

    ts.next_tx(alice_addr);
    let mut coin = ts.take_from_sender<Coin<SUI>>();
    let escrow_coin = coin::split<SUI>(&mut coin, 50, ts.ctx());
    ts.return_to_sender(coin);

    let mut store = test_scenario::take_from_address<escrow_factory::EscrowStore>(&ts, oneinch_addr);
    ts.next_tx(resolver_addr);
    escrow_factory::create_src_escrow(&mut store, secret_hash, 50,12345, escrow_coin, alice_addr, ts.ctx());
    ts.next_tx(oneinch_addr);
    ts.return_to_sender(store);

    ts.next_tx(alice_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 50);
    ts.return_to_sender(coin);

    // Simulate Bob creating a destination escrow
    // (You would call your create_dst_escrow function here)

    // Simulate redeeming the escrow
    // (You would call your redeem function here)

    // Assert balances, states, etc.

    test_scenario::end(ts);
}


#[test]
fun test_create_dst_escrow() {
    let oneinch_addr = @0x11111;
    let alice_addr = @0xAAAAA;
    let resolver_addr = @0xBBBBB;
    let secret = b"Some secret";
    let secret_hash = hash::sha2_256(secret);
    let mut ts = test_scenario::begin(oneinch_addr);

    // Mint test coins for Alice and Bob
    let alice_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    let resolver_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    transfer::public_transfer(alice_coin, alice_addr);
    transfer::public_transfer(resolver_coin, resolver_addr);

    // Initialize the escrow store
    escrow_factory::create(ts.ctx());
    
    ts.next_tx(alice_addr);

    let coin1 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin1), 100);
    ts.return_to_sender(coin1);

    ts.next_tx(resolver_addr);

    let coin2 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin2), 100);
    ts.return_to_sender(coin2);
    
    // Simulate Resolver creating a source escrow
    // (You would call your create_src_escrow function here)

    ts.next_tx(resolver_addr);
    let mut coin = ts.take_from_sender<Coin<SUI>>();
    let escrow_coin = coin::split<SUI>(&mut coin, 50, ts.ctx());
    ts.return_to_sender(coin);

    let mut store = test_scenario::take_from_address<escrow_factory::EscrowStore>(&ts, oneinch_addr);
    ts.next_tx(resolver_addr);
    escrow_factory::create_dst_escrow(&mut store, secret_hash, 50,12345, escrow_coin, alice_addr, ts.ctx());
    ts.next_tx(oneinch_addr);
    ts.return_to_sender(store);

    ts.next_tx(alice_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 100);
    ts.return_to_sender(coin);

    ts.next_tx(resolver_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 50);
    ts.return_to_sender(coin);

    // Simulate Bob creating a destination escrow
    // (You would call your create_dst_escrow function here)

    // Simulate redeeming the escrow
    // (You would call your redeem function here)

    // Assert balances, states, etc.

    test_scenario::end(ts);
}

#[test]
fun test_create_src_and_redeem_escrow() {
    let oneinch_addr = @0x11111;
    let alice_addr = @0xAAAAA;
    let resolver_addr = @0xBBBBB;
    let secret = b"Some secret";
    let secret_hash = hash::sha2_256(secret);
    let mut ts = test_scenario::begin(oneinch_addr);

    // Mint test coins for Alice and resolver
    let alice_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    let resolver_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    transfer::public_transfer(alice_coin, alice_addr);
    transfer::public_transfer(resolver_coin, resolver_addr);

    // Initialize the escrow store
    escrow_factory::create(ts.ctx());
    
    ts.next_tx(alice_addr);

    let coin1 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin1), 100);
    ts.return_to_sender(coin1);

    ts.next_tx(resolver_addr);

    let coin2 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin2), 100);
    ts.return_to_sender(coin2);
    
    // Simulate Resolver creating a source escrow
    // (You would call your create_src_escrow function here)

    ts.next_tx(alice_addr);
    let mut coin = ts.take_from_sender<Coin<SUI>>();
    let escrow_coin = coin::split<SUI>(&mut coin, 70, ts.ctx());
    ts.return_to_sender(coin);

    
    let mut store = test_scenario::take_from_address<escrow_factory::EscrowStore>(&ts, oneinch_addr);
    ts.next_tx(resolver_addr);
    escrow_factory::create_src_escrow(&mut store, secret_hash, 70,12345, escrow_coin, alice_addr, ts.ctx());
    ts.next_tx(oneinch_addr);
    ts.return_to_sender(store);

    ts.next_tx(alice_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 30);
    ts.return_to_sender(coin);

    let mut store = ts.take_from_address<escrow_factory::EscrowStore>(oneinch_addr);
    ts.next_tx(resolver_addr);
    escrow_factory::redeem(&mut store, secret, true, ts.ctx());
    ts.next_tx(oneinch_addr);
    ts.return_to_sender(store);

    ts.next_tx(alice_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 30);
    ts.return_to_sender(coin); 

    ts.next_tx(resolver_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 70);
    ts.return_to_sender(coin);

    // Simulate Bob creating a destination escrow
    // (You would call your create_dst_escrow function here)

    // Simulate redeeming the escrow
    // (You would call your redeem function here)

    // Assert balances, states, etc.

    test_scenario::end(ts);
}

#[test]
fun test_create_dst_and_redeem_escrow() {
    let oneinch_addr = @0x11111;
    let alice_addr = @0xAAAAA;
    let resolver_addr = @0xBBBBB;
    let secret = b"Some secret";
    let secret_hash = hash::sha2_256(secret);
    let mut ts = test_scenario::begin(oneinch_addr);

    // Mint test coins for Alice and resolver
    let alice_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    let resolver_coin = coin::mint_for_testing<SUI>(100, ts.ctx());
    transfer::public_transfer(alice_coin, alice_addr);
    transfer::public_transfer(resolver_coin, resolver_addr);

    // Initialize the escrow store
    escrow_factory::create(ts.ctx());
    
    ts.next_tx(alice_addr);

    let coin1 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin1), 100);
    ts.return_to_sender(coin1);

    ts.next_tx(resolver_addr);

    let coin2 = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value<SUI>(&coin2), 100);
    ts.return_to_sender(coin2);
    
    // Simulate Resolver creating a source escrow
    // (You would call your create_src_escrow function here)

    ts.next_tx(resolver_addr);
    let mut coin = ts.take_from_sender<Coin<SUI>>();
    let escrow_coin = coin::split<SUI>(&mut coin, 40, ts.ctx());
    ts.return_to_sender(coin);

    
    let mut store = test_scenario::take_from_address<escrow_factory::EscrowStore>(&ts, oneinch_addr);
    ts.next_tx(resolver_addr);
    escrow_factory::create_dst_escrow(&mut store, secret_hash, 40,12345, escrow_coin, alice_addr, ts.ctx());
    ts.next_tx(oneinch_addr);
    ts.return_to_sender(store);

    ts.next_tx(resolver_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 60);
    ts.return_to_sender(coin);

    let mut store = ts.take_from_address<escrow_factory::EscrowStore>(oneinch_addr);
    ts.next_tx(resolver_addr);
    escrow_factory::redeem(&mut store, secret, false, ts.ctx());
    ts.next_tx(oneinch_addr);
    ts.return_to_sender(store);

    ts.next_tx(alice_addr);
    let coin = ts.take_from_sender<Coin<SUI>>();
    assert_eq!(coin::value(&coin), 40);
    ts.return_to_sender(coin); 

    // Simulate Bob creating a destination escrow
    // (You would call your create_dst_escrow function here)

    // Simulate redeeming the escrow
    // (You would call your redeem function here)

    // Assert balances, states, etc.

    test_scenario::end(ts);
}