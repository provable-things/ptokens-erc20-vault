const {
  prop,
  curry,
} = require('ramda')
const assert = require('assert')
const VaultArtifact = artifacts.require('Erc20Vault')
const { deployProxy } = require('@openzeppelin/truffle-upgrades')

const GAS_LIMIT = 3e6
const EMPTY_USER_DATA = '0x'

const getPegInEventFromTx = _tx =>
  new Promise((resolve, reject) => {
    const pegInLogs = _tx.logs.filter(_log => _log.event === 'PegIn')
    return pegInLogs.length === 1
      ? resolve(prop(0, pegInLogs))
      : reject(new Error('Could not get PegIn event from transaction!'))
  })

const pegOut = (
  _vaultMethods,
  _tokenHolderAddress,
  _erc20TokenAddress,
  _tokenAmount,
  _from,
  _userData = EMPTY_USER_DATA,
  _gasLimit = GAS_LIMIT,
) =>
  _vaultMethods.pegOut(
    _tokenHolderAddress,
    _erc20TokenAddress,
    _tokenAmount,
    _userData,
    { from: _from, gas: _gasLimit }
  )

const deployNonUpgradeableContract = (_web3, _artifact, _constructorParams = []) =>
  new Promise((resolve, reject) =>
    _artifact
      .new(..._constructorParams)
      .then(({ contract: { _jsonInterface, _address } }) =>
        resolve(new _web3.eth.Contract(_jsonInterface, _address))
      )
      .catch(reject)
  )

const deployUpgradeableContract = curry((_artifact, _argsArray) =>
  deployProxy(_artifact, _argsArray)
)

const deployVaultContract = deployUpgradeableContract(VaultArtifact)

const getRandomEthAddress = _web3 =>
  _web3.utils.randomHex(20)

const addTokenSupport = (_vaultMethods, _tokenAddress, _from, _gasLimit = GAS_LIMIT) =>
  _vaultMethods.addSupportedToken(_tokenAddress, { from: _from, gas: _gasLimit })

const giveVaultAllowance = (
  _tokenMethods,
  _holderAddress,
  _spenderAddress,
  _tokenAmount,
  _gasLimit = GAS_LIMIT
) =>
  _tokenMethods.approve(_spenderAddress, _tokenAmount).send({ from: _holderAddress, gas: _gasLimit })

const assertPegInEvent = (
  _pegInEvent,
  _tokenAddress,
  _tokenSender,
  _tokenAmount,
  _destinationAddress,
  _userData = null,
) => {
  assert.strictEqual(_pegInEvent.args._userData, _userData)
  assert.strictEqual(_pegInEvent.args._tokenSender, _tokenSender)
  assert.strictEqual(_pegInEvent.args._tokenAddress, _tokenAddress)
  assert.strictEqual(_pegInEvent.args._destinationAddress, _destinationAddress)
  assert.strictEqual(_pegInEvent.args._tokenAmount.toString(), `${_tokenAmount}`)
}

const pegInWithoutUserData = (
  _vaultMethods,
  _tokenAddress,
  _tokenAmount,
  _tokenHolder,
  _destinationAddress,
  _gasLimit = GAS_LIMIT,
) =>
  _vaultMethods.pegIn(
    _tokenAmount,
    _tokenAddress,
    _destinationAddress,
    { from: _tokenHolder, gas: _gasLimit }
  )

const maybeStripHexPrefix = _s => _s.toLowerCase().startsWith('0x') ? _s.slice(2) : _s

module.exports = {
  deployNonUpgradeableContract,
  pegInWithoutUserData,
  getRandomEthAddress,
  deployVaultContract,
  getPegInEventFromTx,
  maybeStripHexPrefix,
  giveVaultAllowance,
  assertPegInEvent,
  addTokenSupport,
  pegOut,
}
