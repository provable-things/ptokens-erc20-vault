const path = require('path')
const { readFileSync } = require('fs')
const { HARDHAT_CONFIG_FILE_NAME } = require('./constants')

const getHardhatConfig = _ =>
  new Promise((resolve, reject) => {
    try {
      const config = readFileSync(path.resolve(__dirname, `../${HARDHAT_CONFIG_FILE_NAME}`)).toString()
      return resolve(config)
    } catch (_err) {
      return reject(_err)
    }
  })

const checkNetwork = _network =>
  console.info('✔ Checking network exists in hardhat config...') ||
  getHardhatConfig()
    .then(_configString =>
      _configString.includes(_network)
        ? console.info('✔ Network exists in config!') || _network
        : Promise.reject(new Error(`✘ '${_network}' does NOT exist in '${HARDHAT_CONFIG_FILE_NAME}'!`))
    )

module.exports = {
  checkNetwork
}
