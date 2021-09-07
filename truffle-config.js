const {
  ENDPOINT,
  GAS_PRICE,
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = require('./config.json')
const WalletProvider = require('@truffle/hdwallet-provider')

const GAS_LIMIT = 6e6
const CONFIRMATIONS = 1
const getProvider = _ => new WalletProvider(PRIVATE_KEY, ENDPOINT)

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      websockets: false,
    },
    rinkeby: {
      network_id: 4,
      gas: GAS_LIMIT,
      websockets: true,
      gasPrice: GAS_PRICE,
      provider: _ => getProvider(),
      confirmations: CONFIRMATIONS,
    },
    ethMainnet: {
      gas: 5e6,
      network_id: 1,
      gasPrice: GAS_PRICE,
      provider: _ => getProvider(),
      confirmations: CONFIRMATIONS,
    },
    ropsten: {
      network_id: 3,
      gas: GAS_LIMIT,
      websockets: true,
      gasPrice: GAS_PRICE,
      provider: _ => getProvider(),
      confirmations: CONFIRMATIONS,
    },
    bscMainnet: {
      network_id: 56,
      gas: GAS_LIMIT,
      skipDryRun: true,
      timeoutBlocks: 500,
      gasPrice: GAS_PRICE,
      provider: _ => getProvider(),
      confirmations: CONFIRMATIONS,
    },
    bscTestnet: {
      gas: 8e6,
      network_id: 97,
      skipDryRun: true,
      timeoutBlocks: 500,
      provider: _ => getProvider(),
      gasPrice: GAS_PRICE,
      confirmations: CONFIRMATIONS,
    },
    xDai: {
      gas: GAS_LIMIT,
      network_id: 100,
      skipDryRun: true,
      timeoutBlocks: 10,
      gasPrice: GAS_PRICE,
      provider: _ => getProvider(),
      confirmations: CONFIRMATIONS,
    },
    polygonMaticMainnet: {
      gas: GAS_LIMIT,
      network_id: 137,
      timeoutBlocks: 10,
      networkCheckTimeout: 10000,
      gasPrice: GAS_PRICE,
      provider: _ => getProvider(),
      confirmations: CONFIRMATIONS,
    },
  },
  compilers: {
    solc: {
      version: '0.6.2',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  mocha: {
    enableTimeouts: false
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
  },
}
