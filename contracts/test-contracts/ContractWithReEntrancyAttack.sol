// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface Erc20VaultInterface {
    function setPNetwork(address _pnetwork) external;
}

contract ContractWithReEntrancyAttack {
    function attempReEntrancyAttack() payable public {
        Erc20VaultInterface vaultContract = Erc20VaultInterface(msg.sender);
        vaultContract.setPNetwork(address(this));
    }
}
