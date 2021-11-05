/* eslint-disable no-shadow  */
const Web3 = require('web3')
const { maybeStripHexPrefix } = require('./utils')

const INIT_ABI = {
  'inputs': [
    { 'internalType': 'address', 'name': '_weth', 'type': 'address' },
    { 'internalType': 'address[]', 'name': '_tokensToSupport', 'type': 'address[]' }
  ],
  'name': 'initialize',
  'outputs': [],
  'stateMutability': 'nonpayable',
  'type': 'function'
}

const encodeInitArgs = (_wEthAddress, _tokensToSupport) =>
  console.info('✔ Encoding initialization arguments...') ||
  new Promise((resolve, reject) => {
    const web3 = new Web3()
    try {
      return resolve(web3.eth.abi.encodeFunctionCall(INIT_ABI, [ _wEthAddress, _tokensToSupport ]))
    } catch (_err) {
      return reject(_err)
    }
  })

const getEncodedInitArgs = (_wEthAddress, _tokensToSupport) =>
  encodeInitArgs(_wEthAddress, _tokensToSupport)
    .then(maybeStripHexPrefix)
    .then(console.info)

module.exports = { getEncodedInitArgs }
