const { getVaultContract } = require('./get-vault-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const getPNetwork = (_deployedContractAddress, _address) => {
  console.info(`✔ Setting pNetwork address to ${_address}...`)
  return getVaultContract(_deployedContractAddress)
    .then(callReadOnlyFxnInContract('PNETWORK', []))
    .then(console.info)
}

module.exports = { getPNetwork }
