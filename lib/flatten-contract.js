const path = require('path')
const { exec } = require('child_process')
const { FLATTENED_CONTRACT_FILE_NAME } = require('./constants')

const getFullPathToFlattenedFile = _ =>
  path.resolve(__dirname, `../${FLATTENED_CONTRACT_FILE_NAME}`)

const getFlattenCommand = _ =>
  console.info('✔ Getting flatten command...') ||
  `truffle-flattener ${
    path.resolve(__dirname, '../contracts/Erc20Vault.sol')
  } > ${
    getFullPathToFlattenedFile()
  }`

const executeCommand = _cmd =>
  console.info('✔ Executing flatten command...') ||
  new Promise((resolve, reject) => exec(_cmd, (_err, _stdout) => _err ? reject(_err) : resolve(_stdout)))

const flattenContract = __ =>
  console.info('✔ Flattening contract...') ||
  executeCommand(getFlattenCommand())
    .then(_ => console.info(`✔ Contract flattened! You can find it here:\n${getFullPathToFlattenedFile()}`))

module.exports = { flattenContract }
