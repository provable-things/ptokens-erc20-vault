pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract PErc20OnEos {
    using SafeERC20 for IERC20;

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
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount);
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
        IERC20(_tokenAddress).safeTransfer(_tokenRecipient, _tokenAmount);
        return true;
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
            _migrateSingle(_to, tokenAddress);
        }
    }

    function destroy()
        external
        onlyPNetwork
    {
        for (uint256 i = 0; i < SUPPORTED_TOKEN_ADDRESSES.length; i++) {
            address tokenAddress = SUPPORTED_TOKEN_ADDRESSES[i];
            require(IS_TOKEN_SUPPORTED[tokenAddress] && IERC20(tokenAddress).balanceOf(address(this)) == 0, "Balance of supported tokens must be 0");
        }
        selfdestruct(msg.sender);
    }

    function migrateSingle(
        address payable _to,
        address _tokenAddress
    )
        external
        onlyPNetwork
    {
        _migrateSingle(_to, _tokenAddress);
    }

    function _migrateSingle(
        address payable _to,
        address _tokenAddress
    )
        private
    {
        if (IS_TOKEN_SUPPORTED[_tokenAddress]) {
            IERC20(_tokenAddress).safeTransfer(_to, getTokenBalance(_tokenAddress));
            IS_TOKEN_SUPPORTED[_tokenAddress] = false;
        }
    }
}
