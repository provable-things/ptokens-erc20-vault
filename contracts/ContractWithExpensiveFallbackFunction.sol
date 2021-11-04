// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContractWithExpensiveFallbackFunction {
    mapping(uint256 => address) pointlessMapping;

    event FallbackCalled(uint256 amount, bytes data);

    fallback() external payable {
        for (uint256 i; i < 10; i++) {
            pointlessMapping[i] = msg.sender;
        }
        emit FallbackCalled(msg.value, msg.data);
    }
}
