const { getVaultContract } = require('./get-vault-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const isTokenSupported = (_deployedContractAddress, _address) => {
  console.info(`✔ Checking if token at ${_address} is supported in vault...`)
  return getVaultContract(_deployedContractAddress)
    .then(callReadOnlyFxnInContract('isTokenSupported', [ _address ]))
    .then(console.info)
}

module.exports = { isTokenSupported }
