const { curry } = require('ramda')
const { WEB3_STATE_KEY } = require('./constants')

const checkAddress = curry((_web3, _address) =>
  new Promise((resolve, reject) =>
    _web3.utils.isAddress(_address) ? resolve(_address) : reject(new Error(`✘ Not a valid ETH address: ${_address}`))
  )
)

const checkAddressAndReturnState = curry((_address, _state) =>
  checkAddress(_state[WEB3_STATE_KEY], _address)
    .then(_ => _state)
)

const checkAddressesAndReturnState = curry((_addresses, _state) =>
  Promise
    .all(_addresses.map(checkAddress(_state[WEB3_STATE_KEY])))
    .then(_ => _state)
)

module.exports = {
  checkAddressAndReturnState,
  checkAddressesAndReturnState,
}
