pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PErc20OnEos {
    address public PNETWORK;
    address [] SUPPORTED_TOKEN_ADDRESSES;
    mapping (address => bool) public IS_TOKEN_SUPPORTED;
    event PegIn(address _tokenAddress, address _tokenSender, uint256 _tokenAmount, string _destinationAddress);

    constructor(
        address [] memory _tokensToSupport
    ) public {
        PNETWORK = msg.sender;
        for (uint256 i = 0; i < SUPPORTED_TOKEN_ADDRESSES.length; i++) {
            address tokenAddress = _tokensToSupport[i];
            IS_TOKEN_SUPPORTED[tokenAddress] = true;
            SUPPORTED_TOKEN_ADDRESSES.push(tokenAddress);
        }
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
        IS_TOKEN_SUPPORTED[_tokenAddress] = true;
        SUPPORTED_TOKEN_ADDRESSES.push(_tokenAddress);
        return true;
    }

    function removeSupportedToken(
        address _tokenAddress
    )
        external
        onlyPNetwork
        returns (bool SUCCESS)
    {
        IS_TOKEN_SUPPORTED[_tokenAddress] = false;
        return true;
    }

    function checkTokenIsSupported(
        address _tokenAddress
    )
        internal
    {
        require(IS_TOKEN_SUPPORTED[_tokenAddress], "Token at supplied address is NOT supported!");
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string calldata _destinationAddress
    )
        external
        returns (bool)
    {
        checkTokenIsSupported(_tokenAddress);
        require(_tokenAmount > 0, "Token amount must be greater than zero!");
        IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _tokenAmount);
        emit PegIn(_tokenAddress, msg.sender, _tokenAmount, _destinationAddress);
        return true;
    }

    function pegOut(
        address _tokenRecipient,
        address _tokenAddress,
        uint256 _tokenAmount
    )
        external
        onlyPNetwork
        returns (bool)
    {
        return IERC20(_tokenAddress).transfer(_tokenRecipient, _tokenAmount);
    }

    function getTokenBalance(
        address _tokenAddress
    )
        internal
        returns (uint256)
    {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function migrate(
        address payable _to
    )
        external
        onlyPNetwork
    {
        for (uint256 i = 0; i < SUPPORTED_TOKEN_ADDRESSES.length; i++) {
            address tokenAddress = SUPPORTED_TOKEN_ADDRESSES[i];
            if (IS_TOKEN_SUPPORTED[tokenAddress]) {
                IERC20(tokenAddress).transfer(_to, getTokenBalance(tokenAddress));
            }
        }
        selfdestruct(_to);
    }

    function migrateSingle(
        address payable _to,
        address _tokenAddress
    )
        external
        onlyPNetwork
    {
        if (IS_TOKEN_SUPPORTED[_tokenAddress]) {
            IERC20(_tokenAddress).transfer(_to, getTokenBalance(_tokenAddress));
        }
    }
}
