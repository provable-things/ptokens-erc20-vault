pragma solidity ^0.6.0;

interface Erc20VaultInterface {
    function setPNetwork(address _pnetwork) external;
}

contract CONTRACT_WITH_RE_ENTRANCY_ATTACK {
    function attempReEntrancyAttack() payable public {
        Erc20VaultInterface vaultContract = Erc20VaultInterface(msg.sender);
        vaultContract.setPNetwork(address(this));
    }
}
