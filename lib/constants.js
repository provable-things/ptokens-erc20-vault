const path = require('path')

module.exports = {
  WEB3_STATE_KEY: 'web3',
  ARTIFACT_STATE_KEY: 'artifact',
  TOKEN_ADDRESSES_STATE_KEY: 'tokenAddresses',
  TRUFFLE_BUILD_COMMAND: 'npx truffle compile',
  PATH_TO_EXECUTE_FROM: path.resolve(__dirname, './'),
  RELATIVE_PATH_TO_ARTIFACT: '../build/contracts/PErc20OnEos.json',
}
