pragma solidity ^0.6.0;

contract CONTRACT_WITH_EXPENSIVE_FALLBACK_FXN {
    mapping(uint256 => address) pointlessMapping;

    fallback() external payable {
        for (uint256 i; i < 10; i++) {
            pointlessMapping[i] = msg.sender;
        }
    }
}
