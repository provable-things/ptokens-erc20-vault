// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../wEth/IWETH.sol";

contract WEthUnwrapper {
    address immutable wEthAddress;
    
    constructor(address _wEthAddress) {
        wEthAddress = _wEthAddress;
    }

    function unwrap(uint _amount) public {
        IWETH(wEthAddress).transferFrom(msg.sender, address(this), _amount);
        IWETH(wEthAddress).withdraw(_amount);
        msg.sender.call{ value: _amount }("");
    }

    receive() external payable { }
}