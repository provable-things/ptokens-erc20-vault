const {
  has,
  prop,
  curry,
} = require('ramda')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
const { ETHERSCAN_ENV_VAR_KEY } = require('./constants')

const maybeAddHexPrefix = _hex =>
  Promise.resolve(_hex.startsWith('0x') ? _hex : `0x${_hex}`)

const maybeStripHexPrefix = _hex =>
  _hex.startsWith('0x') ? _hex.slice(2) : _hex

const checkIsHex = _hex =>
  console.info('✔ Checking hex...') ||
  maybeAddHexPrefix(_hex)
    .then(_prefixedHex =>
      ethers.utils.isHexString(_prefixedHex)
        ? console.info('✔ Hex check passed!') || _prefixedHex
        : Promise.reject(new Error(`${_hex} is NOT valid hex!`))
    )

const getKeyFromObj = (_objName, _obj, _key) =>
  new Promise((resolve, reject) => {
    has(_key, _obj)
      ? resolve(prop(_key, _obj))
      : reject(new Error(`${_objName} object does not have key: '${_key}'`))
  })

const checkEthAddress = _address =>
  console.info('✔ Validating ETH address...') ||
  new Promise((resolve, reject) =>
    ethers.utils.isAddress(_address)
      ? console.info('✔ ETH address is valid!') || resolve(_address)
      : reject(new Error(`'${_address}' is NOT a valid ETH address!`))
  )

const shortenEthAddress = _address =>
  `${_address.slice(0, 6)}...${_address.slice(-4)}`

const maybeHandleEtherscanTrimErrMsg = _err =>
  _err.message.includes('etherscan.apiKey.trim is not a function')
    ? Promise.reject(new Error(
      `Please set a valid etherscan API key via the environment variable '${ETHERSCAN_ENV_VAR_KEY}'!`
    ))
    : Promise.reject(_err)

const getEthersContract = curry((_address, _abi, _signer) => {
  console.info(`✔ Getting contract @ '${_address}'...`)
  return new ethers.Contract(_address, _abi, _signer)
})

module.exports = {
  maybeHandleEtherscanTrimErrMsg,
  maybeStripHexPrefix,
  maybeAddHexPrefix,
  shortenEthAddress,
  getEthersContract,
  checkEthAddress,
  getKeyFromObj,
  checkIsHex,
}
