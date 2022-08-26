const {
  has,
  prop
} = require('ramda')
const {
  ENDPOINT_ENV_VAR_KEY,
  ETHERSCAN_ENV_VAR_KEY
} = require('./lib/constants')
const { assoc } = require('ramda')

require('hardhat-erc1820')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('@openzeppelin/hardhat-upgrades')

const SUPPORTED_NETWORKS = [
  'rinkeby',
  'ropsten',
  'ambrosTestnet',
  'ethMainnet',
  'bscMainnet',
  'goerli',
  'prater',
  'sepolia',
]

const getEnvVarOrThow = _name => {
  if (has(_name, process.env))
    return prop(_name, process.env)
  else
    throw new Error(`No '${_name}' env-var found - please provision one!`)
}

const getAllSupportedNetworks = _ =>
  SUPPORTED_NETWORKS.reduce((_acc, _network) =>
    assoc(_network, { url: getEnvVarOrThow(ENDPOINT_ENV_VAR_KEY) }, _acc), {}
  )

const addLocalNetwork = _allSupportedNetworks =>
  assoc('localhost', { url: 'http://localhost:8545' }, _allSupportedNetworks)

const addHardHatNetwork = _allSupportedNetworks =>
  assoc('hardhat', { hardfork: 'istanbul' }, _allSupportedNetworks)

const getAllNetworks = _ =>
  addLocalNetwork(addHardHatNetwork(getAllSupportedNetworks()))

module.exports = {
  networks: getAllNetworks(),
  solidity: {
    version: '0.8.2',
    settings: {
      optimizer: {
        runs: 200,
        enabled: true,
      }
    }
  },
  etherscan: {
    apiKey: process.env[ETHERSCAN_ENV_VAR_KEY]
  },
}
