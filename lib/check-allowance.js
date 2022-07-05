/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
const { BigNumber } = require('ethers')
const { logic } = require('ptokens-utils')

const PTOKEN_ABI_FRAGMENT = [ {
  'inputs': [
    { 'internalType': 'address', 'name': 'holder', 'type': 'address' },
    { 'internalType': 'address', 'name': 'spender', 'type': 'address' }
  ],
  'name': 'allowance',
  'outputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ],
  'stateMutability': 'view',
  'type': 'function'
},
]

const getPTokenContract = (_address, _signer) => {
  return new ethers.Contract(_address, PTOKEN_ABI_FRAGMENT, _signer)
}

const checkAllowanceIsSufficient = (
  _amount,
  _spenderAddress,
  _ownerAddress,
  _tokenAddress,
  _signer,
) =>
  console.info(
    `✔ Checking spender address ${_spenderAddress} has sufficient allowance for token ${_tokenAddress}...`
  ) ||
  logic.racePromise(3000, getPTokenContract(_tokenAddress, _signer).allowance, [ _ownerAddress, _spenderAddress ])
    .then(_allowance => {
      if (_allowance.lt(BigNumber.from(_amount))) {
        return Promise.reject(new Error(`Insufficient allowance to peg in! Got ${_allowance}, need ${_amount}!`))
      } else {
        console.info(`✔ Allowance of ${_allowance} is sufficient!`)
        return
      }
    })

module.exports = { checkAllowanceIsSufficient }
