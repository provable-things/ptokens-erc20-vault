const Web3 = require('web3')
const { assoc } = require('ramda')
const { WEB3_STATE_KEY } = require('./constants')

module.exports.getWeb3AndPutInState = _ =>
  Promise.resolve(assoc(WEB3_STATE_KEY, new Web3(new Web3.providers.HttpProvider('')), {}))
