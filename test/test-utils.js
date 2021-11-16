const {
  ADDRESS_PROP,
  EMPTY_USER_DATA,
} = require('./test-constants')
const assert = require('assert')
const { prop } = require('ramda')

const getPegInEventFromReceipt = _receipt =>
  new Promise((resolve, reject) => {
    const pegInLogs = _receipt.events.filter(_log => _log.event === 'PegIn')
    return pegInLogs.length === 1
      ? resolve(prop(0, pegInLogs))
      : reject(new Error('Could not get PegIn event from transaction!'))
  })

const pegOut = (
  _vaultContract,
  _tokenHolderAddress,
  _erc20TokenAddress,
  _tokenAmount,
  _userData = EMPTY_USER_DATA,
) =>
  _vaultContract['pegOut(address,address,uint256,bytes)'](
    _tokenHolderAddress,
    _erc20TokenAddress,
    _tokenAmount,
    _userData,
  )

const getRandomEthAddress = _ => {
  /* eslint-disable-next-line new-cap */
  const wallet = new ethers.Wallet.createRandom()
  return prop(ADDRESS_PROP, wallet)
}

const addTokenSupport = (_vaultContract, _tokenAddress) =>
  _vaultContract.addSupportedToken(_tokenAddress)

const giveAllowance = (_tokenContract, _spenderAddress, _tokenAmount) =>
  _tokenContract.approve(_spenderAddress, _tokenAmount)

const assertPegInEvent = (
  _pegInEvent,
  _tokenAddress,
  _tokenSender,
  _tokenAmount,
  _destinationAddress,
  _userData = '0x',
) => {
  assert.strictEqual(_pegInEvent.args._userData, _userData)
  assert.strictEqual(_pegInEvent.args._tokenSender, _tokenSender)
  assert.strictEqual(_pegInEvent.args._tokenAddress, _tokenAddress)
  assert.strictEqual(_pegInEvent.args._destinationAddress, _destinationAddress)
  assert.strictEqual(_pegInEvent.args._tokenAmount.toString(), `${_tokenAmount}`)
}

const pegInWithoutUserData = (_vaultContract, _tokenAddress, _tokenAmount, _destinationAddress) =>
  _vaultContract['pegIn(uint256,address,string)'](_tokenAmount, _tokenAddress, _destinationAddress)

const deployUpgradeableContract = (_contractPath, _deployArgs) =>
  ethers.getContractFactory(_contractPath).then(_factory => upgrades.deployProxy(_factory, _deployArgs))

const deployNonUpgradeableContract = (_contractPath, _deployArgs = []) =>
  ethers
    .getContractFactory(_contractPath)
    .then(_factory => _factory.deploy(..._deployArgs))
    .then(_contract => Promise.all([ _contract, _contract.deployTransaction.wait() ]))
    .then(([ _contract ]) => _contract)

const getEventSignatureFromEventFragment = _eventFragment =>
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${
    _eventFragment.name
  }(${
    _eventFragment.inputs
      .map(prop('type'))
      .reduce((_acc, _type, _i) => `${_acc}${_i === 0 ? '' : ','}${_type}`, '')
  })`))

module.exports = {
  getEventSignatureFromEventFragment,
  deployNonUpgradeableContract,
  deployUpgradeableContract,
  getPegInEventFromReceipt,
  pegInWithoutUserData,
  getRandomEthAddress,
  assertPegInEvent,
  addTokenSupport,
  giveAllowance,
  pegOut,
}
