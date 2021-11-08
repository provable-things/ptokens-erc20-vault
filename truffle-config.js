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
  },
  compilers: {
    solc: {
      version: '0.8.9',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
