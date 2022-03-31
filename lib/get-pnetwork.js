const { getVaultContract } = require('./get-vault-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const getPNetwork = _deployedContractAddress => {
  console.info('✔ Getting pNetwork address...')
  return getVaultContract(_deployedContractAddress)
    .then(callReadOnlyFxnInContract('PNETWORK', []))
    .then(console.info)
}

module.exports = { getPNetwork }
