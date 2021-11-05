const ethers = require('ethers')
const { prop } = require('ramda')
const { getProvider } = require('./get-provider')
const { checkEndpoint } = require('./check-endpoint')
const { ENDPOINT_ENV_VAR_KEY } = require('./constants')
const { getEnvironmentVariable } = require('./get-environment-variable')

const getSuggestedFees = _provider =>
  console.info('✔ Getting suggeted fees...') ||
  _provider.getFeeData()

const convertToGwei = _bigNumber =>
  ethers.utils.formatUnits(_bigNumber, 'gwei')

const formatForPrinting = _bigNumber =>
  `${parseFloat(convertToGwei(_bigNumber)).toFixed(2)} Gwei`

const parseSuggestedFeesWithEIP1559Enabled = _suggestedFees =>
  console.info('✔ Parsing suggested fees (EIP1559 is enabled on this chain!)...') ||
  {
    'maxFeePerGas': formatForPrinting(_suggestedFees.maxFeePerGas),
    'maxPriorityFeePerGas': formatForPrinting(_suggestedFees.maxPriorityFeePerGas),
    'gasPrice (Pre EIP1559)': formatForPrinting(_suggestedFees.gasPrice),
  }

const parseSuggestedFeesWithEIP1559NotEnabled = _suggestedFees =>
  console.info('✔ Parsing suggested fees (EIP1559 is NOT enabled on this chain!)...') ||
  { 'gasPrice': formatForPrinting(_suggestedFees.gasPrice) }

const parseSuggestedFees = _suggestedFees =>
  prop('maxFeePerGas', _suggestedFees) === null
    ? parseSuggestedFeesWithEIP1559NotEnabled(_suggestedFees)
    : parseSuggestedFeesWithEIP1559Enabled(_suggestedFees)

const showSuggestedFees = _ =>
  getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY)
    .then(getProvider)
    .then(checkEndpoint)
    .then(getSuggestedFees)
    .then(parseSuggestedFees)
    .then(console.table)

module.exports = { showSuggestedFees }
