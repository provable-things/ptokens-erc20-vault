const {
  WEB3_STATE_KEY,
  ARTIFACT_STATE_KEY,
  CONSTRUCTOR_ARGS_STATE_KEY,
} = require('./constants')

module.exports.getByteCode = _state =>
  new _state[WEB3_STATE_KEY]
    .eth
    .Contract(_state[ARTIFACT_STATE_KEY].abi)
    .deploy({ data: _state[ARTIFACT_STATE_KEY].bytecode, arguments: _state[CONSTRUCTOR_ARGS_STATE_KEY] })
    .encodeABI()
    .slice(2)
