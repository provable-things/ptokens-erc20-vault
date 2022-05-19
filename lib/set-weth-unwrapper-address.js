const { getVaultContract } = require('./get-vault-contract')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')

module.exports.setWEthUnwrapperAddress = (_deployedContractAddress, _address) =>
  console.info(`✔ Setting pNetwork address to ${_address}...`) ||
  getVaultContract(_deployedContractAddress)
    .then(callFxnInContractAndAwaitReceipt('setWEthUnwrapperAddress', [ _address ]))
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))
