const { singletons } = require('@openzeppelin/test-helpers')
require('@openzeppelin/test-helpers/configure')({
  environment: 'truffle',
  provider: web3.currentProvider,
})

module.exports = async (_deployer, _network, _accounts) => {
  if (_network.includes('develop')) {
    await singletons.ERC1820Registry(_accounts[0])
  }
  _deployer.deploy(artifacts.require('PERC20OnEosVault.sol'), '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', [])
}
