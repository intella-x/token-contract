// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../IntellaX.sol";

/**
 * Test Contract code for polygon testnet
 * using different name and symbol
 */
contract SuperStarX is IntellaX {
    string constant _NAME = "SuperStar X";
    string constant _SYMBOL = "SSX";

    constructor(address admin, address childChainManager)
        IntellaX(admin, childChainManager)
    {}

    function name() public pure override returns (string memory) {
        return _NAME;
    }

    function symbol() public pure override returns (string memory) {
        return _SYMBOL;
    }
}
