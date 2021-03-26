pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";

contract ERC777_TOKEN is ERC777 {

    constructor() ERC777("ERC777", "ERC", new address[](0)) public {
        _mint(msg.sender, 1000000, "", "");
        IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24).setInterfaceImplementer(
            address(this),
            keccak256("ERC777TokensRecipient"),
            address(this)
        );
    }
}
