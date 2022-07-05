// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../PolygonIntellaX.sol";

/**
 * Test Contract code for polygon testnet
 * using different name and symbol
 */
contract PolygonSuperStarX is PolygonIntellaX {
    string constant _NAME = "SuperStar X";
    string constant _SYMBOL = "SSX";

    constructor(address admin, address childChainManager)
        PolygonIntellaX(admin, childChainManager)
    {}

    function name() public pure override returns (string memory) {
        return _NAME;
    }

    function symbol() public pure override returns (string memory) {
        return _SYMBOL;
    }
}
