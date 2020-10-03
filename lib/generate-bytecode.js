const { getByteCode } = require('./bytecode-utils')
const { getWeb3AndPutInState } = require('./get-web3')
const { getArtifactAndPutInState } = require('./artifact-utils')
const { checkAddressesAndPutInState } = require('./check-address')
const { runTruffleCompileAndReturnState } = require('./run-truffle-compile')

const INITIAL_STATE = {}

module.exports.generateBytecode = _tokenAddresses =>
  getWeb3AndPutInState(INITIAL_STATE)
    .then(checkAddressesAndPutInState(_tokenAddresses))
    .then(runTruffleCompileAndReturnState)
    .then(getArtifactAndPutInState)
    .then(getByteCode)
    .then(console.info)
    .catch(_err => console.error(_err.message) || process.exit(1))
