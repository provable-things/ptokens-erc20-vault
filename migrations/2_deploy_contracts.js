module.exports = (_deployer, _network, _accounts) =>
  _deployer.deploy(artifacts.require('PErc20OnEos.sol'), [])
