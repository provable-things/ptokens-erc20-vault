const ethers = require('ethers')
const { curry } = require('ramda')
const { getProvider } = require('./get-provider')
const { checkEndpoint } = require('./check-endpoint')
const { getAbi } = require('./get-contract-artifacts')
const { ENDPOINT_ENV_VAR_KEY } = require('./constants')
const { getEthersWallet } = require('./get-ethers-wallet')
const { getEnvironmentVariable } = require('./get-environment-variable')

const getEthersContract = curry((_address, _abi, _signer) => {
  console.info(`✔ Getting contract @ '${_address}'...`)
  return Promise.resolve(new ethers.Contract(_address, _abi, _signer))
})

const getVaultContract = _deployedContractAddress =>
  console.info(`✔ Getting pToken contract @ '${_deployedContractAddress}'...`) ||
  getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY)
    .then(getProvider)
    .then(checkEndpoint)
    .then(_endpoint => Promise.all([ getEthersWallet(_endpoint), getAbi() ]))
    .then(([ _wallet, _abi ]) => getEthersContract(_deployedContractAddress, _abi, _wallet))
    .then(_contract => console.info('✔ Contract retrieved!') || _contract)

module.exports = { getVaultContract }
