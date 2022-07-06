const { logic } = require('ptokens-utils')
const { getEthersContract } = require('./utils')
const { CONTRACT_CALL_TIME_OUT_TIME } = require('./constants')

const VAULT_ABI_FRAGMENT = [{
  'type': 'function',
  'stateMutability': 'view',
  'name': 'isTokenSupported',
  'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
  'inputs': [{ 'internalType': 'address', 'name': '_token', 'type': 'address' }],
}]

const getVaultContract = (_address, _provider) =>
  getEthersContract(_address, VAULT_ABI_FRAGMENT, _provider)

const checkTokenIsSupportedInVault = (_vaultAddress, _tokenAddress, _provider) =>
  console.info(`✔ Checking token @ ${_tokenAddress} is supported in vault @ ${_vaultAddress}...`) ||
  logic.racePromise(
    CONTRACT_CALL_TIME_OUT_TIME,
    getVaultContract(_vaultAddress, _provider).isTokenSupported,
    [ _tokenAddress ],
  )
    .then(_tokenIsSupported => {
      if (_tokenIsSupported) {
        console.info('✔ Token is supported in vault contract!')
        return
      } else {
        return Promise.reject(
          new Error(`Token @ ${_tokenAddress} is NOT supported in vault contract @ ${_vaultAddress}!`)
        )
      }
    })

module.exports = { checkTokenIsSupportedInVault }
