#!/usr/bin/env node

require('dotenv').config()
const { docopt } = require('docopt')
const { version } = require('./package.json')
const { deployVault } = require('./lib/deploy-vault')
const { verifyVault } = require('./lib/verify-vault')
const { flattenContract } = require('./lib/flatten-contract')
const { showSuggestedFees } = require('./lib/show-suggested-fees')
const { getEncodedInitArgs } = require('./lib/get-encoded-init-args')
const { showExistingContractAddresses } = require('./lib/show-existing-contract-addresses')

const HELP_ARG = '--help'
const TOOL_NAME = 'cli.js'
const VERSION_ARG = '--version'
const NETWORK_ARG = '<network>'
const DEPLOY_VAULT_CMD = 'deployVault'
const VERIFY_VAULT_CMD = 'verifyVault'
const WETH_ADDRESS_ARG = '<wEthAddress>'
const FLATTEN_CONTRACT_CMD = 'flattenContract'
const DEPLOYED_ADDRESS_ARG = '<deployedAddress>'
const TOKENS_TO_SUPPORT_ARG = '<tokensToSupport>'
const SHOW_SUGGESTED_FEES_CMD = 'showSuggestedFees'
const GET_ENCODED_INIT_ARGS_CMD = 'getEncodedInitArgs'
const SHOW_EXISTING_CONTRACTS_CMD = 'showExistingContracts'

const USAGE_INFO = `
❍ pTokens ERC20 Vault CLI ❍

  Copyright Provable Things 2021
  Questions: greg@oraclize.it

❍ Info:

  A tool to aid with deployments of & interactions with the upgradeable pToken ERC20 vault logic contract.

  NOTE: The tool requires a '.env' file to exist in the root of the repository with the following info:

    PRIVATE_KEY=<private-key-to-sign-transactions-with>
    ENDPOINT=<rpc-endpoint-for-blochain-to-interact-with>

  NOTE: To call the '${VERIFY_VAULT_CMD}' function, the following extra environment variable is required:

    ETHERSCAN_API_KEY=<api-key-for-automated-contract-verifications>

❍ Usage:
  ${TOOL_NAME} ${HELP_ARG}
  ${TOOL_NAME} ${VERSION_ARG}
  ${TOOL_NAME} ${DEPLOY_VAULT_CMD}
  ${TOOL_NAME} ${FLATTEN_CONTRACT_CMD}
  ${TOOL_NAME} ${SHOW_SUGGESTED_FEES_CMD}
  ${TOOL_NAME} ${SHOW_EXISTING_CONTRACTS_CMD}
  ${TOOL_NAME} ${VERIFY_VAULT_CMD} ${NETWORK_ARG} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_ENCODED_INIT_ARGS_CMD} ${WETH_ADDRESS_ARG} ${TOKENS_TO_SUPPORT_ARG}...

❍ Commands:
  ${SHOW_SUGGESTED_FEES_CMD}     ❍ Show 'ethers.js' suggested fees.
  ${DEPLOY_VAULT_CMD}           ❍ Deploy the ERC20 vault logic contract.
  ${VERIFY_VAULT_CMD}           ❍ Verify a deployed pToken logic contract.
  ${FLATTEN_CONTRACT_CMD}       ❍ Flatten the contract in case manual verification is required.
  ${GET_ENCODED_INIT_ARGS_CMD}    ❍ Calculate the initializer function arguments in ABI encoded format.
  ${SHOW_EXISTING_CONTRACTS_CMD} ❍ Show list of existing logic contract addresses on various blockchains.

❍ Options:
  ${HELP_ARG}                ❍ Show this message.
  ${VERSION_ARG}             ❍ Show tool version.
  ${DEPLOYED_ADDRESS_ARG}     ❍ The ETH address of the deployed vault.
  ${TOKENS_TO_SUPPORT_ARG}     ❍ Addresses of ERC20 tokens the vault will support.
  ${WETH_ADDRESS_ARG}         ❍ The address for the wrapped ETH token on the blockchain to be deployed to.
  ${NETWORK_ARG}             ❍ Network the vault is deployed on. It must exist in the 'hardhat.config.json'.
`
const main = _ => {
  const CLI_ARGS = docopt(USAGE_INFO, { version })
  if (CLI_ARGS[FLATTEN_CONTRACT_CMD])
    return flattenContract()
  else if (CLI_ARGS[SHOW_SUGGESTED_FEES_CMD])
    return showSuggestedFees()
  else if (CLI_ARGS[DEPLOY_VAULT_CMD])
    return deployVault()
  else if (CLI_ARGS[VERIFY_VAULT_CMD])
    return verifyVault(CLI_ARGS[NETWORK_ARG], CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  else if (CLI_ARGS[SHOW_EXISTING_CONTRACTS_CMD])
    return showExistingContractAddresses()
  else if (CLI_ARGS[GET_ENCODED_INIT_ARGS_CMD])
    return getEncodedInitArgs(CLI_ARGS[WETH_ADDRESS_ARG], CLI_ARGS[TOKENS_TO_SUPPORT_ARG])
}

main().catch(_err => console.error('✘', _err.message))
