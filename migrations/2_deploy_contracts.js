module.exports = (_deployer, _network, _accounts) =>
  _deployer.deploy(artifacts.require('PErc20OnEos.sol'), [], '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
