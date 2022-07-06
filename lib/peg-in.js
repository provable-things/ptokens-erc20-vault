const { getVaultContract } = require('./get-vault-contract')
const { checkAllowanceIsSufficient } = require('./check-allowance')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')
const { checkTokenBalanceIsSufficient } = require('./check-token-balance')

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
    .then(_vaultContact => Promise.all([ _vaultContact, _vaultContact.signer.getAddress() ]))
    .then(([ _vaultContract, _tokenOwnerAddress ]) => {
      const provider = _vaultContract.provider

      // NOTE: We could make both balance & allowance checks in this `Promise.all` but we want them
      // sequential since if the balance is insufficient then of course the allowance would also be.
      // This way, the user sees the most relevant error first if extant.
      return Promise.all([
        _vaultContract,
        _tokenOwnerAddress,
        provider,
        checkTokenBalanceIsSufficient(_amount, _tokenOwnerAddress, _tokenAddress, provider)
      ])
    })
    .then(([ _vaultContract, _tokenOwnerAddress, _provider ]) =>
      Promise.all([
        _vaultContract,
        checkAllowanceIsSufficient(_amount, _vaultAddress, _tokenOwnerAddress, _tokenAddress, _provider)
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
