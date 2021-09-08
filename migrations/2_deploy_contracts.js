const {
  WETH_ADDRESS,
  TOKENS_TO_SUPPORT,
} = require('../config')
const { singletons } = require('@openzeppelin/test-helpers')
require('@openzeppelin/test-helpers/configure')({
  environment: 'truffle',
  provider: web3.currentProvider,
})

const checkAddress = _address =>
  web3.utils.isAddress(_address)

const checkWethAddress = _ => {
  console.info('✔ Checking `WETH_ADDRESS` in `config.json`...')
  if (!checkAddress(WETH_ADDRESS)) {
    console.info('✘ `WETH_ADDRESS` in `config.json` is NOT a valid ETH address!')
    process.exit(1)
  }
  console.info('✔ `WETH_ADDRESS` in `config.json` is valid!')
}

const checkTokensToSupport = _ => {
  console.info('✔ Checking `TOKENS_TO_SUPPORT` in `config.json`...')
  if (TOKENS_TO_SUPPORT.length === 0) {
    console.info('✔ No `TOKENS_TO_SUPPORT` in `config.json`, skipping check!')
    return
  }
  const invalidAddresses = TOKENS_TO_SUPPORT
    .map(checkAddress)
    .filter((_addressIsValid, _i) => {
      if (!_addressIsValid) {
        console.info(`✘'${TOKENS_TO_SUPPORT[_i]} is NOT a valid ETH address!`)
        return true
      }
    })
  if (invalidAddresses.length > 0) {
    console.info('✘  `TOKENS_TO_SUPPORT` in `config.json` contains an invalid ETH address!')
    process.exit(1)
  }
  console.info('✔ `TOKENS_TO_SUPPORT` in `config.json` are valid!')
}

module.exports = async (_deployer, _network, _accounts) => {
  if (_network.includes('develop')) await singletons.ERC1820Registry(_accounts[0])
  checkWethAddress()
  checkTokensToSupport()
  _deployer.deploy(artifacts.require('Erc20Vault'), WETH_ADDRESS, TOKENS_TO_SUPPORT)
}
