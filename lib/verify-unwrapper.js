const { checkEthAddress } = require('./utils')
const { checkNetwork } = require('./check-network')
const { executeCommand } = require('./execute-command')
const { ETHERSCAN_ENV_VAR_KEY } = require('./constants')
const { maybeHandleEtherscanTrimErrMsg } = require('./utils')
const { getEnvConfiguration } = require('./get-env-configuration')
const { checkEnvironmentVariableExists } = require('./get-environment-variable')

const executeVerificationCommand = executeCommand('✔ Executing verification command...')

const getVerificationCommand = (_address, _network, _wEthAddress) => {
  return `npx hardhat verify --contract contracts/weth-unwrapper/WEthUnwrapper.sol:WEthUnwrapper --network ${_network} ${_address} ${_wEthAddress}`
}

const verifyUnwrapper = (_network, _address, _wEthAddress) =>
  console.info('✔ Verifying vault contract...') ||
  getEnvConfiguration()
    .then(_ => checkEthAddress(_address))
    .then(_ => checkNetwork(_network))
    .then(_ => checkEnvironmentVariableExists(ETHERSCAN_ENV_VAR_KEY))
    .then(_ => getVerificationCommand(_address, _network, _wEthAddress))
    .then(executeVerificationCommand)
    .then(console.info)
    .catch(maybeHandleEtherscanTrimErrMsg)

module.exports = {
  verifyUnwrapper
}
