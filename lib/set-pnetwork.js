const { getVaultContract } = require('./get-vault-contract')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')

const setPNetwork = (_deployedContractAddress, _address) => {
  console.info(`✔ Setting pNetwork address to ${_address}...`)
  return getVaultContract(_deployedContractAddress)
    .then(callFxnInContractAndAwaitReceipt('setPNetwork', [ _address ]))
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))
}

module.exports = { setPNetwork }
