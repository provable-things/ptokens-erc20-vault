const { getVaultContract } = require('./get-vault-contract')
const { checkAllowanceIsSufficient } = require('./check-allowance')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')

const pegIn = (
  _deployedContractAddress,
  _amount,
  _tokenAddress,
  _destinationAddress,
  _destinactionChainId,
  _userData = '0x',
) =>
  console.info('✔ Pegging in...') ||
  getVaultContract(_deployedContractAddress)
    .then(_vaultContact => Promise.all([ _vaultContact, _vaultContact.signer.getAddress() ]))
    .then(([ _vaultContract, _ownerAddress ]) =>
      Promise.all([
        _vaultContract,
        checkAllowanceIsSufficient(
          _amount,
          _deployedContractAddress, // NOTE: This is the "spender" address, the vault in this case!
          _ownerAddress,
          _tokenAddress,
          _vaultContract.provider,
        )
      ])
    )
    .then(([ _vaultContract ]) =>
      callFxnInContractAndAwaitReceipt(
        'pegIn(uint256,address,string,bytes,bytes4)',
        [ _amount, _tokenAddress, _destinationAddress, _userData, _destinactionChainId ],
        _vaultContract,
      )
    )
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))

module.exports = { pegIn }
