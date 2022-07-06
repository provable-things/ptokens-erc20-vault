const { getEthersContract } = require('./utils')

const TOKEN_ABI = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'holder', 'type': 'address' },
      { 'internalType': 'address', 'name': 'spender', 'type': 'address' }
    ],
    'name': 'allowance',
    'outputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [ { 'internalType': 'address', 'name': 'tokenHolder', 'type': 'address' } ],
    'name': 'balanceOf',
    'outputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
]

const getTokenContract = (_address, _signer) =>
  console.info(`✔ Getting token contract @ '${_address}'...`) ||
  getEthersContract(_address, TOKEN_ABI, _signer)

module.exports = { getTokenContract }
