const { getVaultContract } = require('./get-vault-contract')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')

const pegIn = (
  _deployedContractAddress,
  _amount,
  _tokenAddress,
  _destinationAddress,
  _destinactionChainId,
  _userData = '0x',
) => {
  console.info('✔ Pegging in...')
  return getVaultContract(_deployedContractAddress)
    .then(callFxnInContractAndAwaitReceipt(
      'pegIn(uint256,address,string,bytes,bytes4)',
      [ _amount, _tokenAddress, _destinationAddress, _userData, _destinactionChainId ]
    ))
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))
}

module.exports = { pegIn }
