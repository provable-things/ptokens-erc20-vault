const {
  assoc,
  curry,
} = require('ramda')
const {
  WEB3_STATE_KEY,
  TOKEN_ADDRESSES_STATE_KEY,
} = require('./constants')

const checkAddress = curry((_web3, _address) =>
  new Promise((resolve, reject) =>
    _web3.utils.isAddress(_address)
      ? resolve(_address)
      : reject(new Error(`✘ Not a valid ETH address: ${_address}`))
  )
)

const checkAddresses = (_web3, _addresses) =>
  Promise.all(_addresses.map(checkAddress(_web3)))

const addTokenAddressesToState = curry((_state, _addresses) =>
  assoc(TOKEN_ADDRESSES_STATE_KEY, _addresses, _state)
)

module.exports.checkAddressesAndPutInState = curry((_tokenAddresses, _state) =>
  checkAddresses(_state[WEB3_STATE_KEY], _tokenAddresses)
    .then(addTokenAddressesToState(_state))
)
