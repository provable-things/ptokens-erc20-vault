/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')

const TOKEN_ABI = [{
  'inputs': [
    { 'internalType': 'address', 'name': 'holder', 'type': 'address' },
    { 'internalType': 'address', 'name': 'spender', 'type': 'address' }
  ],
  'name': 'allowance',
  'outputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ],
  'stateMutability': 'view',
  'type': 'function'
}]

const getTokenContract = (_address, _signer) => {
  console.info(`✔ Getting token contract @ '${_address}'...`)
  return new ethers.Contract(_address, TOKEN_ABI, _signer)
}

module.exports = { getTokenContract }