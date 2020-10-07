const {
  assoc,
  curry,
} = require('ramda')
const { CONSTRUCTOR_ARGS_STATE_KEY } = require('./constants')

const dedupArray = _array => Array.from(new Set([ ..._array ]))

module.exports.prepareConstructorArgsAndAddToState = curry((_wethAddress, _tokenAddresses, _state) =>
  assoc(CONSTRUCTOR_ARGS_STATE_KEY, [ _wethAddress, dedupArray(_tokenAddresses) ], _state)
)
