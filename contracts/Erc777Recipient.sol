// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC777/ERC777Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/IERC1820RegistryUpgradeable.sol";

contract Erc777Recipient is IERC777RecipientUpgradeable {
  IERC1820RegistryUpgradeable private _erc1820 = IERC1820RegistryUpgradeable(
    0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
  );

  bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

  event TokensReceivedCallback(
    address operator,
    address from,
    address to,
    uint256 amount,
    bytes userData,
    bytes operatorData
  );

  bool public tokenReceivedCalled;
  bytes public tokensReceivedData;
  bytes public fallbackFunctionCallData;

  constructor() {
    _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
  }

  function tokensReceived(
    address operator,
    address from,
    address to,
    uint256 amount,
    bytes calldata userData,
    bytes calldata operatorData
  ) override external {
    emit TokensReceivedCallback(operator, from, to, amount, userData, operatorData);
    tokenReceivedCalled = true;
    tokensReceivedData = userData;
  }

  fallback() external payable {
    fallbackFunctionCallData = msg.data;
  }

  receive() external payable {}
}
