pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20_TOKEN is ERC20 {
    constructor() ERC20("ERC20", "ERC") public {
        _mint(msg.sender, 1000000);
    }
}
