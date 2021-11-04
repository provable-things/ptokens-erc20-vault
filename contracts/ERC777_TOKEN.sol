// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract ERC777_TOKEN is ERC777 {

    constructor() ERC777("ERC777", "ERC", new address[](0)) {
        _mint(msg.sender, 1000000, "", "");
    }
}
