pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IWETH.sol";
import "./Withdrawable.sol";

contract Erc20Vault is Withdrawable, IERC777Recipient {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    IERC1820Registry constant private _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    bytes32 constant private ERC777_TOKEN_INTERFACE_HASH = keccak256("ERC777Token");

    EnumerableSet.AddressSet private supportedTokens;
    address public PNETWORK;
    IWETH public weth;
    address public SAFEMOON_ADDRESS;
    uint256 public LAST_SEEN_SAFEMOON_BALANCE;

    event PegIn(
        address _tokenAddress,
        address _tokenSender,
        uint256 _tokenAmount,
        string _destinationAddress,
        bytes _userData
    );

    constructor(
        address _weth,
        address [] memory _tokensToSupport,
        address _safeMoonAddress
    ) public {
        PNETWORK = msg.sender;
        for (uint256 i = 0; i < _tokensToSupport.length; i++) {
            supportedTokens.add(_tokensToSupport[i]);
        }
        weth = IWETH(_weth);
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        SAFEMOON_ADDRESS = _safeMoonAddress;
    }

    modifier onlyPNetwork() {
        require(msg.sender == PNETWORK, "Caller must be PNETWORK address!");
        _;
    }

    receive() external payable {
        require(msg.sender == address(weth));
    }

    function setWeth(address _weth) external onlyPNetwork {
        weth = IWETH(_weth);
    }

    function setSafeMoon(address _safeMoonAddress) external onlyPNetwork {
        SAFEMOON_ADDRESS = _safeMoonAddress;
    }

    function setPNetwork(address _pnetwork) external onlyPNetwork {
        PNETWORK = _pnetwork;
    }

    function IS_TOKEN_SUPPORTED(address _token) external view returns(bool) {
        return supportedTokens.contains(_token);
    }

    function _owner() internal override returns(address) {
        return PNETWORK;
    }

    function adminWithdrawAllowed(address asset) internal override view returns(uint) {
        return supportedTokens.contains(asset) ? 0 : super.adminWithdrawAllowed(asset);
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

    function getSupportedTokens() external view returns(address[] memory res) {
        res = new address[](supportedTokens.length());
        for (uint256 i = 0; i < supportedTokens.length(); i++) {
            res[i] = supportedTokens.at(i);
        }
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string calldata _destinationAddress
    )
        external
        returns (bool)
    {
        return pegIn(_tokenAmount, _tokenAddress, _destinationAddress, "");
    }

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string memory _destinationAddress,
        bytes memory _userData
    )
        public
        returns (bool)
    {
        require(_tokenAddress != SAFEMOON_ADDRESS, "Cannot peg in SafeMoon here - use `pegInSafeMoon` instead!");
        require(supportedTokens.contains(_tokenAddress), "Token at supplied address is NOT supported!");
        require(_tokenAmount > 0, "Token amount must be greater than zero!");
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        emit PegIn(_tokenAddress, msg.sender, _tokenAmount, _destinationAddress, _userData);
        return true;
    }

    /**
     * @dev Implementation of IERC777Recipient.
     */
    function tokensReceived(
        address /*operator*/,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata /*operatorData*/
    ) external override {
        address _tokenAddress = msg.sender;
        require(supportedTokens.contains(_tokenAddress), "caller is not a supported ERC777 token!");
        require(to == address(this), "Token receiver is not this contract");
        if (userData.length > 0) {
            require(amount > 0, "Token amount must be greater than zero!");
            (bytes32 tag, string memory _destinationAddress) = abi.decode(userData, (bytes32, string));
            require(tag == keccak256("ERC777-pegIn"), "Invalid tag for automatic pegIn on ERC777 send");
            emit PegIn(_tokenAddress, from, amount, _destinationAddress, userData);
        }
    }

    function pegInEth(string calldata _destinationAddress)
        external
        payable
        returns (bool)
    {
        return pegInEth(_destinationAddress, "");
    }

    function pegInEth(
        string memory _destinationAddress,
        bytes memory _userData
    )
        public
        payable
        returns (bool)
    {
        require(supportedTokens.contains(address(weth)), "WETH is NOT supported!");
        require(msg.value > 0, "Ethers amount must be greater than zero!");
        weth.deposit.value(msg.value)();
        emit PegIn(address(weth), msg.sender, msg.value, _destinationAddress, _userData);
        return true;
    }

    function pegOutWeth(
        address payable _tokenRecipient,
        uint256 _tokenAmount,
        bytes memory _userData
    )
        internal
        returns (bool)
    {
        weth.withdraw(_tokenAmount);
        // NOTE: This is the latest recommendation (@ time of writing) for transferring ETH. This no longer relies
        // on the provided 2300 gas stipend and instead forwards all available gas onwards.
        // SOURCE: https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now
        (bool success, ) = _tokenRecipient.call.value(_tokenAmount)(_userData);
        require(success, "ETH transfer failed when pegging out wETH!");
    }

    function pegOutSafeMoon(
        address _tokenRecipient,
        uint256 _tokenAmount
    )
        internal
        returns (bool)
    {
        // NOTE: SafeMoon does NOT implement `ERC777Token` or `ERC777TokensRecipient`, & so no metadata can be passed.
        IERC20(SAFEMOON_ADDRESS).safeTransfer(_tokenRecipient, _tokenAmount);
        setLastSeenSafeMoonBalance(getSafeMoonTokenBalance());
        return true;
    }

    function pegOut(
        address payable _tokenRecipient,
        address _tokenAddress,
        uint256 _tokenAmount
    )
        public
        onlyPNetwork
        returns (bool)
    {
        if (_tokenAddress == address(weth)) {
            pegOutWeth(_tokenRecipient, _tokenAmount, "");
        } else if (_tokenAddress == SAFEMOON_ADDRESS) {
            pegOutSafeMoon(_tokenRecipient, _tokenAmount);
        } else {
            IERC20(_tokenAddress).safeTransfer(_tokenRecipient, _tokenAmount);
        }
        return true;
    }


    function pegOut(
        address payable _tokenRecipient,
        address _tokenAddress,
        uint256 _tokenAmount,
        bytes calldata _userData
    )
        external
        onlyPNetwork
        returns (bool)
    {
        if (_tokenAddress == address(weth)) {
            pegOutWeth(_tokenRecipient, _tokenAmount, _userData);
        } else if (_tokenAddress == SAFEMOON_ADDRESS) {
            pegOutSafeMoon(_tokenRecipient, _tokenAmount);
        } else {
            address erc777Address = _erc1820.getInterfaceImplementer(_tokenAddress, ERC777_TOKEN_INTERFACE_HASH);
            if (erc777Address == address(0)) {
                return pegOut(_tokenRecipient, _tokenAddress, _tokenAmount);
            } else {
                IERC777(erc777Address).send(_tokenRecipient, _tokenAmount, _userData);
                return true;
            }
        }
    }

    function migrate(
        address payable _to
    )
        external
        onlyPNetwork
    {
        uint256 numberOfTokens = supportedTokens.length();
        for (uint256 i = 0; i < numberOfTokens; i++) {
            address tokenAddress = supportedTokens.at(0);
            _migrateSingle(_to, tokenAddress);
        }
    }

    function destroy()
        external
        onlyPNetwork
    {
        for (uint256 i = 0; i < supportedTokens.length(); i++) {
            address tokenAddress = supportedTokens.at(i);
            require(getContractBalanceOf(tokenAddress) == 0, "Balance of supported tokens must be 0");
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
            IERC20(_tokenAddress).safeTransfer(_to, getContractBalanceOf(_tokenAddress));
            supportedTokens.remove(_tokenAddress);
        }
    }

    function getContractBalanceOf(
        address _tokenAddress
    )
        view
        internal
        returns (uint256)
    {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function getSafeMoonTokenBalance()
        view
        public
        returns(uint256)
    {
        return getContractBalanceOf(SAFEMOON_ADDRESS);
    }

    function setLastSeenSafeMoonBalance(
        uint256 _newLastSeenSafeMoonBalance
    )
        internal
    {
        LAST_SEEN_SAFEMOON_BALANCE = _newLastSeenSafeMoonBalance;
    }

    function getSafeMoonMetadata(
        uint256 _tokenAmount,
        bytes memory _userData
    )
        view
        public
        returns(bytes memory)
    {
        return abi.encode(LAST_SEEN_SAFEMOON_BALANCE, LAST_SEEN_SAFEMOON_BALANCE.add(_tokenAmount), _userData);
    }

    function incrementLastSeenSafeMoonBalance(
        uint256 _incrementAmount
    )
        internal
    {
        LAST_SEEN_SAFEMOON_BALANCE = LAST_SEEN_SAFEMOON_BALANCE.add(_incrementAmount);
    }

    function pegInSafeMoon(
        uint256 _tokenAmount,
        string calldata _destinationAddress
    )
        external
        returns (bool)
    {
        return pegInSafeMoon(_tokenAmount, _destinationAddress, "");
    }

    function pegInSafeMoon(
        uint256 _tokenAmount,
        string memory _destinationAddress,
        bytes memory _userData
    )
        public
        returns (bool)
    {
        require(supportedTokens.contains(SAFEMOON_ADDRESS), "Token at supplied address is NOT supported!");
        require(_tokenAmount > 0, "Token amount must be greater than zero!");
        IERC20(SAFEMOON_ADDRESS).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        emit PegIn(
            SAFEMOON_ADDRESS,
            msg.sender,
            _tokenAmount,
            _destinationAddress,
            getSafeMoonMetadata(_tokenAmount, _userData)
        );
        incrementLastSeenSafeMoonBalance(_tokenAmount);
        return true;
    }
}
