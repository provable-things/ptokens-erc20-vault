const { prop } = require('ramda')
const { getProvider } = require('./get-provider')
const { checkEndpoint } = require('./check-endpoint')
const { deployContract } = require('./deploy-contract')
const { ENDPOINT_ENV_VAR_KEY } = require('./constants')
const { getEthersWallet } = require('./get-ethers-wallet')
const { getEnvConfiguration } = require('./get-env-configuration')
const { getEnvironmentVariable } = require('./get-environment-variable')
const { getUnwrapperContractFactory } = require('./get-contract-factory')

const deployUnwrapperContract = _wEthAddress =>
  console.info(`✔ Deploying unwrapper non-upgradable contract w/ args: (${
    _wEthAddress
  })`) ||
    getEnvConfiguration()
      .then(_ => getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY))
      .then(getProvider)
      .then(checkEndpoint)
      .then(getEthersWallet)
      .then(getUnwrapperContractFactory)
      .then(_cFactory => deployContract(_cFactory, [ _wEthAddress ]))
      .then(_contract => _contract.deployTransaction.wait())
      .then(_receipt =>
        console.info(`✔ Tx Mined! Contract address: ${
          prop('contractAddress', _receipt)
        }`)
      )

module.exports = {
  deployUnwrapperContract
}
