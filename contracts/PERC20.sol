pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PERC20 {
    address public PNETWORK;
    mapping(address => bool) public SUPPORTED_TOKENS;

    constructor() public {
        PNETWORK = msg.sender;
    }

    function getERC20Interface(
        address _address
    )
        view
        internal
        returns (IERC20)
    {
        return IERC20(_address);
    }

    modifier onlyPNetwork() {
        require(msg.sender == PNETWORK, "Caller must be PNETWORK address!");
        _;
    }

    function addSupportedToken(
        address _tokenAddress
    )
        external
        onlyPNetwork
        returns (bool SUCCESS)
    {
        SUPPORTED_TOKENS[_tokenAddress] = true;
        return true;
    }

    function removeSupportedToken(
        address _tokenAddress
    )
        external
        onlyPNetwork
        returns (bool SUCCESS)
    {
        SUPPORTED_TOKENS[_tokenAddress] = false;
        return true;
    }
}
