pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract ERC777_TOKEN is ERC777 {

    constructor() ERC777("ERC777", "ERC", new address[](0)) public {
        _mint(msg.sender, 1000000, "", "");
    }
}
