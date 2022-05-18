import "../wEth/IWETH.sol";
import "hardhat/console.sol";

contract Unwrapper {
    address immutable wEthAddress;
    
    constructor(address _wEthAddress) {
        wEthAddress = _wEthAddress;
    }

    function unwrap(uint _amount) public {
        console.log("unwrapper balance 2: %s", address(this).balance);

        IWETH(wEthAddress).transferFrom(msg.sender, address(this), _amount);
        IWETH(wEthAddress).withdraw(_amount);
        msg.sender.call{ value: _amount }("");
    }

    receive() external payable { }
}