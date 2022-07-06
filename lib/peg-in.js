const { getVaultContract } = require('./get-vault-contract')
const { maybeApproveAllowance } = require('./maybe-approve-allowance')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')
const { checkTokenBalanceIsSufficient } = require('./check-token-balance')
const { checkTokenIsSupportedInVault } = require('./check-token-is-supported')

const pegIn = (
  _vaultAddress,
  _amount,
  _tokenAddress,
  _destinationAddress,
  _destinactionChainId,
  _userData = '0x',
) =>
  console.info('✔ Pegging in...') ||
  getVaultContract(_vaultAddress)
    .then(_vaultContract => Promise.all([ _vaultContract, _vaultContract.signer.getAddress() ]))
    .then(([ _vaultContract, _tokenOwnerAddress, ]) =>
      Promise.all([
        _vaultContract,
        _tokenOwnerAddress,
        checkTokenBalanceIsSufficient(_amount, _tokenOwnerAddress, _tokenAddress, _vaultContract.provider)
      ])
    )
    .then(([ _vaultContract, _tokenOwnerAddress ]) =>
      Promise.all([
        _vaultContract,
        maybeApproveAllowance(_amount, _vaultAddress, _tokenOwnerAddress, _tokenAddress, _vaultContract.signer)
      ])
    )
    .then(([ _vaultContract ]) =>
      Promise.all([
        _vaultContract,
        checkTokenIsSupportedInVault(_vaultAddress, _tokenAddress, _vaultContract.provider),
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
