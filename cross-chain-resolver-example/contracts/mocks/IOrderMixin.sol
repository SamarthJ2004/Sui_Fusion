// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

type TakerTraits is uint256;

interface IOrderMixin {
    struct Order {
        address makerAsset;
        address takerAsset;
        // Add more fields as needed
    }

    function fillOrderArgs(
        Order calldata order,
        bytes32 r,
        bytes32 vs,
        uint256 amount,
        TakerTraits takerTraits,
        bytes calldata interaction
    ) external returns (uint256);
}
