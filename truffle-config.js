require('dotenv').config()
const PrivateKeyProvider = require('truffle-privatekey-provider')

const getEnvironmentVariable = _envVar =>
  process.env[_envVar]
    ? process.env[_envVar]
    : console.error('✘ Cannot migrate! Please provide an infura api key & a private key as an env variables!') ||
      process.exit(1)

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      websockets: true
    },
    rinkeby: {
      provider: () =>
        new PrivateKeyProvider(
          getEnvironmentVariable('PRIVATE_KEY'),
          `https://rinkeby.infura.io/v3/${getEnvironmentVariable('INFURA_KEY')}`
        ),
      network_id: 4,
      gas: 6e6,
      gasPrice: 5e9,
      websockets: true
    }
  },
  compilers: {
    solc: {
      version: '0.5.5',
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
  }
}
