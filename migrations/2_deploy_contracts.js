module.exports = (_deployer, _network, _accounts) =>
  _deployer.deploy(artifacts.require('PERC20.sol'))
