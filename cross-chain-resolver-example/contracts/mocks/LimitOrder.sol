// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import './IOrderMixin.sol';

contract MockLimitOrderProtocol is IOrderMixin {
    function fillOrderArgs(
        Order calldata,
        bytes32,
        bytes32,
        uint256,
        TakerTraits,
        bytes calldata
    ) external pure override returns (uint256) {
        return 0;
    }
}
