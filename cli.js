#!/usr/bin/env node

require('dotenv').config()
const { docopt } = require('docopt')
const { version } = require('./package.json')
const { flattenContract } = require('./lib/flatten-contract')
const { showSuggestedFees } = require('./lib/show-suggested-fees')

const HELP_ARG = '--help'
const VERSION_ARG = '--version'
const TOOL_NAME = 'vault-cli.js'
const FLATTEN_CONTRACT_CMD = 'flattenContract'
const SHOW_SUGGESTED_FEES_CMD = 'showSuggestedFees'

const USAGE_INFO = `
❍ pTokens ERC20 Vault CLI ❍

  Copyright Provable Things 2021
  Questions: greg@oraclize.it

❍ Info:

  A tool to aid with deployments of & interactions with the upgradeable pToken ERC20 vault logic contract.

  NOTE: The tool requires a '.env' file to exist in the root of the repository with the following info:

    PRIVATE_KEY=<private-key-to-sign-transactions-with>
    ENDPOINT=<rpc-endpoint-for-blochain-to-interact-with>

❍ Usage:
  ${TOOL_NAME} ${HELP_ARG}
  ${TOOL_NAME} ${VERSION_ARG}
  ${TOOL_NAME} ${FLATTEN_CONTRACT_CMD}
  ${TOOL_NAME} ${SHOW_SUGGESTED_FEES_CMD}

❍ Commands:
  ${SHOW_SUGGESTED_FEES_CMD}     ❍ Show 'ethers.js' suggested fees.
  ${FLATTEN_CONTRACT_CMD}       ❍ Flatten the contract in case manual verification is required.

❍ Options:
  ${HELP_ARG}                ❍ Show this message.
  ${VERSION_ARG}             ❍ Show tool version.
`
const main = _ => {
  const CLI_ARGS = docopt(USAGE_INFO, { version })
  if (CLI_ARGS[FLATTEN_CONTRACT_CMD]) {
    return flattenContract()
  } else if (CLI_ARGS[SHOW_SUGGESTED_FEES_CMD]) {
    return showSuggestedFees()
  }
}

main().catch(_err => console.error('✘', _err.message))
