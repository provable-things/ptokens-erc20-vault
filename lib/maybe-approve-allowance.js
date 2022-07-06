const { BigNumber } = require('ethers')
const { logic } = require('ptokens-utils')
const { getTokenContract } = require('./get-token-contract')
const { CONTRACT_CALL_TIME_OUT_TIME } = require('./constants')

const approveAllowance = (_amount, _vaultAddress, _tokenAddress, _signer) =>
  console.info(`✔ Approving vault to spend ${_amount} tokens, please wait for mining...`) ||
  getTokenContract(_tokenAddress, _signer)
    .approve(_vaultAddress, _amount)
    .then(_tx => _tx.wait())
    .then(_ => console.info('✔ Approval succeeded! Continuing with peg in...'))

const maybeApproveAllowance = (_amount, _vaultAddress, _ownerAddress, _tokenAddress, _signer) =>
  console.info(`✔ Checking spender ${_vaultAddress} has sufficient allowance for token ${_tokenAddress}...`) ||
    logic.racePromise(
      CONTRACT_CALL_TIME_OUT_TIME,
      getTokenContract(_tokenAddress, _signer).allowance,
      [ _ownerAddress, _vaultAddress ],
    )
      .then(_allowance => {
        if (_allowance.lt(BigNumber.from(_amount))) {
          // NOTE: At least one of the tokens we bridge has a special approval mechanism whereby if we
          // want to change an allowance that is already > 0, we must first set it to 0 and then to our
          // desired amount. This logic does NOT currently handle this case.
          console.info('✘ Allowance is not sufficient!')
          return approveAllowance(_amount, _vaultAddress, _tokenAddress, _signer)
        } else {
          console.info(`✔ Allowance of ${_allowance} is already sufficient!`)
          return
        }
      })

module.exports = { maybeApproveAllowance }
