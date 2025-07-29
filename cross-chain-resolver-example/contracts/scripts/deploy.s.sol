// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import 'forge-std/Script.sol';
import '../src/TestEscrowFactory.sol';
import '../src/Resolver.sol';

// Import interfaces for dependencies if they are not in your src folder
// import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IOrderMixin} from 'limit-order-protocol/contracts/interfaces/IOrderMixin.sol';

contract DeployScript is Script {
    function run() public returns (address escrowFactory, address resolver) {
        uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
        address initialOwner = vm.envAddress('INITIAL_OWNER');

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TestEscrowFactory
        // You'll need to replace these with actual addresses or mock them for local testing
        address mockLimitOrderProtocol = 0x43079AE9711D4aF943C10ca5d964115F0205a103;
        IERC20 mockFeeToken = IERC20(0xc0e5F487000a6c1aA901bAa8D7CfAF28292D5e56);
        IERC20 mockAccessToken = IERC20(0x8d29F3D524728cAAe3911d05CB1061322461fe8e);
        uint32 rescueDelaySrc = 3600; // 1 hour
        uint32 rescueDelayDst = 3600;

        TestEscrowFactory factory = new TestEscrowFactory(
            mockLimitOrderProtocol,
            mockFeeToken,
            mockAccessToken,
            initialOwner,
            rescueDelaySrc,
            rescueDelayDst
        );
        escrowFactory = address(factory);

        // Deploy Resolver
        IOrderMixin mockLOP = IOrderMixin(mockLimitOrderProtocol); // Using same mock for simplicity
        Resolver resolverContract = new Resolver(factory, mockLOP, initialOwner);
        resolver = address(resolverContract);

        vm.stopBroadcast();

        console.log('TestEscrowFactory deployed at:', escrowFactory);
        console.log('Resolver deployed at:', resolver);
    }
}

// contract SimpleDeployScript is Script {
//     function run() public {
//         console.log("Hello from Forge script!");
//     }
// }
