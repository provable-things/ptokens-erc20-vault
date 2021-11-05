const { checkIsHex } = require('./utils')

const checkPrivateKey = _privateKey =>
  console.info('✔ Checking private key..') ||
  checkIsHex(_privateKey)
    .then(_checkedPrivateKey => {
      const ETH_KEY_NUM_CHARS = 66
      return _checkedPrivateKey.length === ETH_KEY_NUM_CHARS
        ? console.info('✔ Private key check passed!') || _checkedPrivateKey
        : Promise.reject(new Error(`ETH private keys should be ${ETH_KEY_NUM_CHARS - 2} hex chars long!`))
    })

module.exports = { checkPrivateKey }
