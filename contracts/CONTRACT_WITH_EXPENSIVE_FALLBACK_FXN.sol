pragma solidity ^0.6.0;

contract CONTRACT_WITH_EXPENSIVE_FALLBACK_FXN {
    mapping(uint256 => address) pointlessMapping;

    event FallbackCalled(uint256 amount, bytes data);

    fallback() external payable {
        for (uint256 i; i < 10; i++) {
            pointlessMapping[i] = msg.sender;
        }
        emit FallbackCalled(msg.value, msg.data);
    }
}
