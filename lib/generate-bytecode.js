const {
  checkAddressAndReturnState,
  checkAddressesAndReturnState,
} = require('./check-address')
const { getByteCode } = require('./bytecode-utils')
const { getWeb3AndPutInState } = require('./get-web3')
const { getArtifactAndPutInState } = require('./artifact-utils')
const { runTruffleCompileAndReturnState } = require('./run-truffle-compile')
const { prepareConstructorArgsAndAddToState } = require('./prepare-constructor-args')

const INITIAL_STATE = {}

module.exports.generateBytecode = (_wethAddress, _tokenAddresses) =>
  getWeb3AndPutInState(INITIAL_STATE)
    .then(checkAddressAndReturnState(_wethAddress))
    .then(checkAddressesAndReturnState(_tokenAddresses))
    .then(prepareConstructorArgsAndAddToState(_wethAddress, _tokenAddresses))
    .then(runTruffleCompileAndReturnState)
    .then(getArtifactAndPutInState)
    .then(getByteCode)
    .then(console.info)
    .catch(_err => console.error(_err.message) || process.exit(1))
