const { singletons } = require('@openzeppelin/test-helpers')
const { deployProxy } = require('@openzeppelin/truffle-upgrades')

require('@openzeppelin/test-helpers/configure')({
  environment: 'truffle',
  provider: web3.currentProvider,
})

module.exports = async (_deployer, _network, _accounts) => {
  if (_network.includes('develop')) await singletons.ERC1820Registry(_accounts[0])
  const wEthAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  await deployProxy(
    artifacts.require('Erc20Vault'),
    [ wEthAddress, [ wEthAddress ] ],
    { _deployer, initializer: 'initialize' },
  )
}
