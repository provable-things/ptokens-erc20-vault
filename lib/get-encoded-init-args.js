/* eslint-disable no-shadow  */
const ethers = require('ethers')
const { maybeStripHexPrefix } = require('./utils')

const encodeInitArgs = (_wEthAddress, _tokensToSupport, _originChainId) => {
  console.info('✔ Encoding pToken initialization arguments...')
  /* eslint-disable-next-line max-len */
  const abiFragment = 'function initialize(address _weth, address[] _tokensToSupport, bytes4 _originChainId)'
  return Promise.resolve(
    new ethers.utils.Interface([ abiFragment ])
      .encodeFunctionData(
        'initialize',
        [ _wEthAddress, _tokensToSupport, _originChainId ],
      )
  )
}

const getEncodedInitArgs = (_wEthAddress, _tokensToSupport, _originChainId) =>
  encodeInitArgs(_wEthAddress, _tokensToSupport, _originChainId)
    .then(maybeStripHexPrefix)
    .then(console.info)

module.exports = { getEncodedInitArgs }
