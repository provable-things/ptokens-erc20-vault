const { BigNumber } = require('ethers')
const { logic } = require('ptokens-utils')
const { getTokenContract } = require('./get-token-contract')
const { CONTRACT_CALL_TIME_OUT_TIME } = require('./constants')

const checkTokenBalanceIsSufficient = (_amount, _tokenOwnerAddress, _tokenAddress, _signer) =>
  console.info(`✔ Checking spender ${_tokenOwnerAddress} has sufficient balance of token ${_tokenAddress}...`) ||
    logic.racePromise(
      CONTRACT_CALL_TIME_OUT_TIME,
      getTokenContract(_tokenAddress, _signer).balanceOf,
      [ _tokenOwnerAddress ],
    )
      .then(_tokenBalance => {
        if (_tokenBalance.lt(BigNumber.from(_amount))) {
          return Promise.reject(
            new Error(`Insufficient token balance to peg in! Got ${_tokenBalance}, need ${_amount}!`)
          )
        } else {
          console.info(`✔ Token balance of ${_tokenBalance} is sufficient!`)
          return
        }
      })

module.exports = { checkTokenBalanceIsSufficient }
