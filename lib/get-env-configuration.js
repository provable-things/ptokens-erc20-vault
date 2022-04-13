const path = require('path')
const { cli, utils } = require('ptokens-utils')

const ENV_FILE_REGEXP = new RegExp('.*.env')

module.exports.getEnvConfiguration = () =>
  utils.listFilesInFolder(path.resolve(__dirname, '..'))
    .then(utils.applyRegExpToListOfStrings(ENV_FILE_REGEXP))
    .then(cli.maybeAskUserToSelectOption('Please select the .env file', 'None file .env found!'))
    .then(_choice => require('dotenv').config({ path: path.resolve(process.cwd(), _choice) }))
