// SPDX-License-Identifier: MIT
pragma solidity >=0.4.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AbstractOwnable.sol";

abstract contract Withdrawable is AbstractOwnable {
  using SafeERC20 for IERC20;
  address constant ETHER = address(0);

  event LogWithdrawToken(
    address indexed _from,
    address indexed _token,
    uint amount
  );

  /**
   * @dev Withdraw asset.
   * @param asset Asset to be withdrawn.
   */
  function adminWithdraw(address asset) public onlyOwner {
    uint tokenBalance = adminWithdrawAllowed(asset);
    require(tokenBalance > 0, "admin witdraw not allowed");
    _withdraw(asset, tokenBalance);
  }

  function _withdraw(address _tokenAddress, uint _amount) internal {
    if (_tokenAddress == ETHER) {
      payable(msg.sender).transfer(_amount);
    } else {
      IERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
    }
    emit LogWithdrawToken(msg.sender, _tokenAddress, _amount);
  }

  // can be overridden to disallow withdraw for some token
  function adminWithdrawAllowed(address asset) internal virtual view returns(uint allowedAmount) {
    allowedAmount = asset == ETHER
      ? address(this).balance
      : IERC20(asset).balanceOf(address(this));
  }
}
