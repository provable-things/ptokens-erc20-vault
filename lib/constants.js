const path = require('path')

module.exports = {
  WEB3_STATE_KEY: 'web3',
  ARTIFACT_STATE_KEY: 'artifact',
  TRUFFLE_BUILD_COMMAND: 'npx truffle compile',
  CONSTRUCTOR_ARGS_STATE_KEY: 'constructorArgs',
  PATH_TO_EXECUTE_FROM: path.resolve(__dirname, './'),
  RELATIVE_PATH_TO_ARTIFACT: '../build/contracts/Erc20VaultVault.json',
}
