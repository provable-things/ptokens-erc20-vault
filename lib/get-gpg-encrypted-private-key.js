const path = require('path')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
const { existsSync } = require('fs')
const { exec } = require('child_process')
const { cli, utils } = require('ptokens-utils')

const stripNewLines = _s =>
  _s.replace(/\r?\n|\r/g, '')

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

const executeCommand = _cmd =>
  console.info('✔ Decrypting private key...') ||
  new Promise((resolve, reject) =>
    exec(_cmd, (_err, _stdout, _stderr) => _err ? reject(_err) : _stderr ? reject(_stderr) : resolve(_stdout))
  )

const getDecryptionCommand = _pathToPrivateKey =>
  `gpg -d ${_pathToPrivateKey} 2>/dev/null`

const checkPrivateKeyFileExists = _pathToPrivateKey =>
  console.info('✔ Checking private key file exists...') ||
  new Promise((resolve, reject) =>
    existsSync(_pathToPrivateKey)
      ? console.info('✔ Private key file exists!') || resolve(_pathToPrivateKey)
      : reject(new Error(`GPG encrypted private key does NOT exist @ '${_pathToPrivateKey}'`))
  )

const checkPrivateKey = _privateKey =>
  console.info('✔ Checking private key..') ||
  checkIsHex(_privateKey)
    .then(_checkedPrivateKey => {
      const ETH_KEY_NUM_CHARS = 66
      return _checkedPrivateKey.length === ETH_KEY_NUM_CHARS
        ? console.info('✔ Private key check passed!') || _checkedPrivateKey
        : Promise.reject(new Error(`ETH private keys should be ${ETH_KEY_NUM_CHARS - 2} hex chars long!`))
    })

const PRIVATE_KEY_REGEXP = new RegExp('private-key.*.gpg')

const maybeGetPrivateKeyFiles = () =>
  utils.listFilesInFolder(path.resolve(__dirname, '..'))
    .then(utils.applyRegExpToListOfStrings(PRIVATE_KEY_REGEXP))
    .then(cli.maybeAskUserToSelectOption('Select the private key to use:', 'None file private-key*.gpg found!'))

const getGpgEncryptedPrivateKey = _ =>
  console.info('✔ Getting GPG encrypted private key..') ||
  maybeGetPrivateKeyFiles()
    .then(checkPrivateKeyFileExists)
    .then(getDecryptionCommand)
    .then(executeCommand)
    .then(stripNewLines)
    .then(checkPrivateKey)

module.exports = { getGpgEncryptedPrivateKey }
