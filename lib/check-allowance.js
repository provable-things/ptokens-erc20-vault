const { BigNumber } = require('ethers')
const { logic } = require('ptokens-utils')
const { getTokenContract } = require('./get-token-contract')

const TIMEOUT_TIME = 3000

const checkAllowanceIsSufficient = (
  _amount,
  _spenderAddress,
  _ownerAddress,
  _tokenAddress,
  _signer,
) =>
  console.info(`✔ Checking spender ${_spenderAddress} has sufficient allowance for token ${_tokenAddress}...`) ||
    logic.racePromise(
      TIMEOUT_TIME,
      getTokenContract(_tokenAddress, _signer).allowance,
      [ _ownerAddress, _spenderAddress ],
    )
      .then(_allowance => {
        if (_allowance.lt(BigNumber.from(_amount))) {
          return Promise.reject(new Error(`Insufficient allowance to peg in! Got ${_allowance}, need ${_amount}!`))
        } else {
          console.info(`✔ Allowance of ${_allowance} is sufficient!`)
          return
        }
      })

module.exports = { checkAllowanceIsSufficient }
