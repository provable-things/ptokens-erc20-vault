const { getVaultContract } = require('./get-vault-contract')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')

const pegIn = (
  _deployedContractAddress,
  _amount,
  _tokenAddress,
  _destinationAddress,
  _userData,
) => {
  console.info(`✔ Pegging in...`)
  return getVaultContract(_deployedContractAddress)
    .then(callFxnInContractAndAwaitReceipt('pegIn', [ _amount, _tokenAddress, _destinationAddress, _userData ]))
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))
}

module.exports = { pegIn }