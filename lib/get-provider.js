const {
  identity,
  memoizeWith,
} = require('ramda')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')

const getProvider = memoizeWith(identity, _endpoint => {
  console.info(`✔ Getting provider using endpoint '${_endpoint}'...`)
  return Promise.resolve(new ethers.providers.JsonRpcProvider(_endpoint))
})

module.exports = { getProvider }
