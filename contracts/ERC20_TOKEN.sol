// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20_TOKEN is ERC20 {
    constructor() ERC20("ERC20", "ERC") {
        _mint(msg.sender, 1000000);
    }
}
