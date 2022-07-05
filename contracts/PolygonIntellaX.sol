// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseIntellaX.sol";
import "./interfaces/IChildToken.sol";

/**
 * Intella X token contract for Polygon L2 network
 *
 * this token contract is wrapped token for IntellaX on polygon network
 *
 * implements polygon bridge's child token interface
 * supports openzeppelin's AccessControl and ERC20Permit extension by extending BaseIntellaX
 * admin - the address holds default admin permission and pauser role
 * childChainManager - polygon's child chain manager address
 */
contract PolygonIntellaX is BaseIntellaX, IChildToken {
    string constant NAME = "Intella X";
    string constant SYMBOL = "IX";

    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");

    constructor(address admin, address childChainManager)
        BaseIntellaX(admin, NAME, SYMBOL)
    {
        _grantRole(DEPOSITOR_ROLE, childChainManager);
    }

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting the required amount for user
     * Make sure minting is done only by this function
     * @param user user address for whom deposit is being done
     * @param depositData abi encoded amount
     */
    function deposit(address user, bytes calldata depositData)
        external
        override
        onlyRole(DEPOSITOR_ROLE)
    {
        uint256 amount = abi.decode(depositData, (uint256));
        _mint(user, amount);
    }

    /**
     * @notice called when user wants to withdraw tokens back to root chain
     * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
     * @param amount amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external override {
        _burn(_msgSender(), amount);
    }
}
