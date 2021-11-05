const {
  has,
  prop,
} = require('ramda')
const ethers = require('ethers')

const maybeAddHexPrefix = _hex =>
  Promise.resolve(_hex.startsWith('0x') ? _hex : `0x${_hex}`)

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

module.exports = {
  maybeAddHexPrefix,
  shortenEthAddress,
  checkEthAddress,
  getKeyFromObj,
  checkIsHex,
}
