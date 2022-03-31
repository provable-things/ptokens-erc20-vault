const { getVaultContract } = require('./get-vault-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const getSupportedTokens = (_deployedContractAddress, _address) => {
  console.info('✔ Getting supported tokens from vault...')
  return getVaultContract(_deployedContractAddress)
    .then(callReadOnlyFxnInContract('getSupportedTokens', []))
    .then(console.info)
}

module.exports = { getSupportedTokens }
