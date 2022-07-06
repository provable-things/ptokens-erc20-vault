const { curry } = require('ramda')
const { getEthersContract } = require('./utils')
const { getProvider } = require('./get-provider')
const { checkEndpoint } = require('./check-endpoint')
const { ENDPOINT_ENV_VAR_KEY } = require('./constants')
const { getEthersWallet } = require('./get-ethers-wallet')
const { getVaultAbi } = require('./get-contract-artifacts')
const { getEnvConfiguration } = require('./get-env-configuration')
const { getEnvironmentVariable } = require('./get-environment-variable')

const getVaultEthersContract = curry((_address, _signer) =>
  console.info('✔ Getting vault contract...') ||
  getVaultAbi().then(_abi => getEthersContract(_address, _abi, _signer))
)

const getVaultContract = _deployedContractAddress =>
  console.info(`✔ Getting pToken contract @ '${_deployedContractAddress}'...`) ||
  getEnvConfiguration()
    .then(() => getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY))
    .then(getProvider)
    .then(checkEndpoint)
    .then(getEthersWallet)
    .then(getVaultEthersContract(_deployedContractAddress))
    .then(_contract => console.info('✔ Vault contract retrieved!') || _contract)

module.exports = { getVaultContract }
