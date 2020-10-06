pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./IWETH.sol";

contract PErc20OnEos {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private supportedTokens;
    address public PNETWORK;
    IWETH public weth;

    event PegIn(address _tokenAddress, address _tokenSender, uint256 _tokenAmount, string _destinationAddress);

    constructor(
        address [] memory _tokensToSupport,
        address _weth
    ) public {
        PNETWORK = msg.sender;
        for (uint256 i = 0; i < _tokensToSupport.length; i++) {
            supportedTokens.add(_tokensToSupport[i]);
        }
        weth = IWETH(_weth);
    }

    modifier onlyPNetwork() {
        require(msg.sender == PNETWORK, "Caller must be PNETWORK address!");
        _;
    }

    function IS_TOKEN_SUPPORTED(address _token) external view returns(bool) {
        return supportedTokens.contains(_token);
    }

    function addSupportedToken(
        address _tokenAddress
    )
        external
        onlyPNetwork
        returns (bool SUCCESS)
    {
        supportedTokens.add(_tokenAddress);
        return true;
    }

    function removeSupportedToken(
        address _tokenAddress
    )
        external
        onlyPNetwork
        returns (bool SUCCESS)
    {
        return supportedTokens.remove(_tokenAddress);
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string calldata _destinationAddress
    )
        external
        returns (bool)
    {
        require(supportedTokens.contains(_tokenAddress), "Token at supplied address is NOT supported!");
        require(_tokenAmount > 0, "Token amount must be greater than zero!");
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        emit PegIn(_tokenAddress, msg.sender, _tokenAmount, _destinationAddress);
        return true;
    }

    function pegInEth(string calldata _destinationAddress)
        external
        payable
        returns (bool)
    {
        require(supportedTokens.contains(address(weth)), "WETH is NOT supported!");
        require(msg.value > 0, "Ethers amount must be greater than zero!");
        weth.deposit.value(msg.value)();
        emit PegIn(address(weth), msg.sender, msg.value, _destinationAddress);
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

    function pegOutEth(
        address payable _recipient,
        uint256 _amount
    )
        external
        onlyPNetwork
        returns (bool)
    {
        weth.withdraw(_amount);
        _recipient.transfer(_amount);
        return true;
    }

    function migrate(
        address payable _to
    )
        external
        onlyPNetwork
    {
        for (uint256 i = 0; i < supportedTokens.length(); i++) {
            address tokenAddress = supportedTokens.at(i);
            _migrateSingle(_to, tokenAddress);
        }
    }

    function destroy()
        external
        onlyPNetwork
    {
        for (uint256 i = 0; i < supportedTokens.length(); i++) {
            address tokenAddress = supportedTokens.at(i);
            require(IERC20(tokenAddress).balanceOf(address(this)) == 0, "Balance of supported tokens must be 0");
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
        if (supportedTokens.contains(_tokenAddress)) {
            uint balance = IERC20(_tokenAddress).balanceOf(address(this));
            IERC20(_tokenAddress).safeTransfer(_to, balance);
            supportedTokens.remove(_tokenAddress);
        }
    }
}
