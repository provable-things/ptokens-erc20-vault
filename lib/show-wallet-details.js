const {
  has,
  prop,
} = require('ramda')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
const { getProvider } = require('./get-provider')
const { checkEndpoint } = require('./check-endpoint')
const { ENDPOINT_ENV_VAR_KEY } = require('./constants')
const { getEthersWallet } = require('./get-ethers-wallet')
const { getEnvironmentVariable } = require('./get-environment-variable')

const getWalletAddress = _wallet =>
  new Promise((resolve, reject) => {
    const ADDRESS_KEY = 'address'
    has(ADDRESS_KEY)
      ? resolve(prop(ADDRESS_KEY, _wallet))
      : reject(new Error(`Wallet object does not have '${ADDRESS_KEY}' key!`))
  })

const getWalletBalance = _wallet =>
  getWalletAddress(_wallet)
    .then(_address => _wallet.provider.send('eth_getBalance', [ _address, 'latest' ]))
    .then(ethers.BigNumber.from)

const showWalletDetails = _ =>
  console.info('✔ Showing wallet details...') ||
  getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY)
    .then(getProvider)
    .then(checkEndpoint)
    .then(getEthersWallet)
    .then(_wallet => Promise.all([ getWalletAddress(_wallet), getWalletBalance(_wallet) ]))
    .then(([ _address, _balance ]) => {
      console.info('✔ Wallet address:', _address)
      console.info(`✔ Wallet balance: ${_balance} (${ethers.utils.formatUnits(_balance, 'ether')} ETH)`)
    })

module.exports = { showWalletDetails }
