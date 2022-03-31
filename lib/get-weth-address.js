const { getVaultContract } = require('./get-vault-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const getWEthAddress = _deployedContractAddress => {
  console.info('✔ Getting wETH address from contract...')
  return getVaultContract(_deployedContractAddress)
    .then(callReadOnlyFxnInContract('weth', []))
    .then(console.info)
}

module.exports = { getWEthAddress }
