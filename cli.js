#!/usr/bin/env node
/* eslint-disable max-len */
const { docopt } = require('docopt')
const { pegIn } = require('./lib/peg-in')
const { version } = require('./package.json')
const { setPNetwork } = require('./lib/set-pnetwork')
const { getPNetwork } = require('./lib/get-pnetwork')
const { deployVault } = require('./lib/deploy-vault')
const { verifyVault } = require('./lib/verify-vault')
const { getWEthAddress } = require('./lib/get-weth-address')
const { verifyUnwrapper } = require('./lib/verify-unwrapper')
const { isTokenSupported } = require('./lib/is-token-supported')
const { showWalletDetails } = require('./lib/show-wallet-details')
const { addSupportedToken } = require('./lib/add-supported-token')
const { showSuggestedFees } = require('./lib/show-suggested-fees')
const { getSupportedTokens } = require('./lib/get-supported-tokens')
const { deployUnwrapperContract } = require('./lib/deploy-unwrapper')
const { getEncodedInitArgs } = require('./lib/get-encoded-init-args')
const { setWEthUnwrapperAddress } = require('./lib/set-weth-unwrapper-address')
const { showExistingContractAddresses } = require('./lib/show-existing-contract-addresses')

const HELP_ARG = '--help'
const TOOL_NAME = 'cli.js'
const PEG_IN_CMD = 'pegIn'
const AMOUNT_ARG = '<amount>'
const TOKEN_FLAG = '--token'
const VERSION_ARG = '--version'
const NETWORK_ARG = '<network>'
const ETH_ADDRESS_ARG = '<ethAddress>'
const SET_PNETWORK_CMD = 'setPNetwork'
const GET_PNETWORK_CMD = 'getPNetwork'
const WETH_ADDRESS_ARG = '<wEthAddress>'
const DEPLOY_VAULT_CMD = 'deployVaultContract'
const VERIFY_VAULT_CMD = 'verifyVaultContract'
const GET_WETH_ADDRESS = 'getWEthAddress'
const TOKEN_ADDRESS_ARG = '<tokenAddress>'
const USER_DATA_OPTIONAL_ARG = '--userData'
const ORIGIN_CHAIN_ID_ARG = '<originChainId>'
const FLATTEN_CONTRACT_CMD = 'flattenContract'
const TOKENS_ARG = `${TOKEN_FLAG}=<ethAddress>`
const DEPLOYED_ADDRESS_ARG = '<deployedAddress>'
const IS_TOKEN_SUPPORTED_CMD = 'isTokenSupported'
const GET_ENCODED_INIT_ARGS_CMD = 'encodeInitArgs'
const SHOW_SUGGESTED_FEES_CMD = 'showSuggestedFees'
const SHOW_WALLET_DETAILS_CMD = 'showWalletDetails'
const ADD_SUPPORTED_TOKEN_CMD = 'addSupportedToken'
const GET_SUPPORTED_TOKENS_CMD = 'getSupportedTokens'
const SET_WETH_UNWRAPPER_ADDRESS = 'setWEthUnwrapperAddress'
const VERIFY_UNWRAPPER_CMD = 'verifyUnwrapperContract'
const DEPLOY_UNWRAPPER_CMD = 'deployUnwrapperContract'
const DESTINATION_ADDRESS_ARG = '<destinationAddress>'
const DESTINATION_CHAIN_ID_ARG = '<destinationChainId>'
const USER_DATA_ARG = `${USER_DATA_OPTIONAL_ARG}=<hex>`
const SHOW_EXISTING_CONTRACTS_CMD = 'showExistingContracts'

const USAGE_INFO = `
❍ pTokens ERC20 Vault Command Line Interface

  Copyright Provable Things 2021
  Questions: greg@oraclize.it

❍ Info:

  A tool to aid with deployments of & interactions with the upgradeable pToken ERC20 vault logic contract.

  NOTE: Functions that make transactions require a private key. Please provide a GPG encrpyted file called
    'private-key.gpg' containing your key in the root of the repository. Create one via:
    'echo <your-private-key> | gpg -c --output private-key.gpg'

  NOTE: The tool requires a '.env' file to exist in the root of the repository with the following info:
    ENDPOINT=<rpc-endpoint-for-blochain-to-interact-with>

  NOTE: To call the '${VERIFY_VAULT_CMD}' function, the following extra environment variable is required:
    ETHERSCAN_API_KEY=<api-key-for-automated-contract-verifications>

❍ Usage:
  ${TOOL_NAME} ${HELP_ARG}
  ${TOOL_NAME} ${VERSION_ARG}
  ${TOOL_NAME} ${DEPLOY_VAULT_CMD}
  ${TOOL_NAME} ${FLATTEN_CONTRACT_CMD}
  ${TOOL_NAME} ${SHOW_SUGGESTED_FEES_CMD}
  ${TOOL_NAME} ${SHOW_WALLET_DETAILS_CMD}
  ${TOOL_NAME} ${SHOW_EXISTING_CONTRACTS_CMD}
  ${TOOL_NAME} ${GET_PNETWORK_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_WETH_ADDRESS} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_SUPPORTED_TOKENS_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${VERIFY_VAULT_CMD} ${NETWORK_ARG} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${SET_PNETWORK_CMD} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${DEPLOY_UNWRAPPER_CMD} ${WETH_ADDRESS_ARG}
  ${TOOL_NAME} ${IS_TOKEN_SUPPORTED_CMD} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${ADD_SUPPORTED_TOKEN_CMD} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${SET_WETH_UNWRAPPER_ADDRESS} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${VERIFY_UNWRAPPER_CMD} ${NETWORK_ARG} ${DEPLOYED_ADDRESS_ARG} ${WETH_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_ENCODED_INIT_ARGS_CMD} ${WETH_ADDRESS_ARG} ${ORIGIN_CHAIN_ID_ARG} [${TOKENS_ARG}...]
  ${TOOL_NAME} ${PEG_IN_CMD} ${DEPLOYED_ADDRESS_ARG} ${AMOUNT_ARG} ${TOKEN_ADDRESS_ARG} ${DESTINATION_ADDRESS_ARG} ${DESTINATION_CHAIN_ID_ARG} [${USER_DATA_ARG}]

❍ Commands:
  ${SET_PNETWORK_CMD}           ❍ Set the pNetwork address.
  ${SHOW_SUGGESTED_FEES_CMD}     ❍ Show 'ethers.js' suggested fees.
  ${DEPLOY_VAULT_CMD}        ❍ Deploy the ERC20 vault logic contract.
  ${DEPLOY_UNWRAPPER_CMD}    ❍ Deploy the WETH unwrapper contract.
  ${VERIFY_VAULT_CMD}        ❍ Verify a deployed pToken logic contract.
  ${VERIFY_UNWRAPPER_CMD}    ❍ Verify a deployed WETH unwrapper contract.
  ${GET_PNETWORK_CMD}           ❍ Show the pNetwork address of the vault at ${DEPLOYED_ADDRESS_ARG}.
  ${GET_WETH_ADDRESS}        ❍ Show the wETH address set in the vault at ${DEPLOYED_ADDRESS_ARG}.
  ${FLATTEN_CONTRACT_CMD}       ❍ Flatten the contract in case manual verification is required.
  ${GET_SUPPORTED_TOKENS_CMD}    ❍ Show list of tokens supprted by the vault at ${DEPLOYED_ADDRESS_ARG}.
  ${SHOW_WALLET_DETAILS_CMD}     ❍ Decrypts the private key and shows address & balance information.
  ${IS_TOKEN_SUPPORTED_CMD}      ❍ Is token at ${ETH_ADDRESS_ARG} supported in vault at ${DEPLOYED_ADDRESS_ARG}.
  ${GET_ENCODED_INIT_ARGS_CMD}        ❍ Calculate the initializer function arguments in ABI encoded format.
  ${SHOW_EXISTING_CONTRACTS_CMD} ❍ Show list of existing logic contract addresses on various blockchains.
  ${ADD_SUPPORTED_TOKEN_CMD}      ❍ Adds token at ${ETH_ADDRESS_ARG} to the supported tokens in vault at ${DEPLOYED_ADDRESS_ARG}.
  ${SET_WETH_UNWRAPPER_ADDRESS}       ❍ Sets the WETH unwrapper contract at ${ETH_ADDRESS_ARG} in the vault at ${DEPLOYED_ADDRESS_ARG}.
  ${PEG_IN_CMD}                 ❍ Peg in ${AMOUNT_ARG} of ${TOKEN_ADDRESS_ARG} to ${DESTINATION_ADDRESS_ARG} on ${DESTINATION_CHAIN_ID_ARG}.

❍ Options:
  ${HELP_ARG}                ❍ Show this message.
  ${VERSION_ARG}             ❍ Show tool version.
  ${ETH_ADDRESS_ARG}          ❍ A valid ETH address.
  ${TOKEN_ADDRESS_ARG}        ❍ ETH address of token.
  ${DEPLOYED_ADDRESS_ARG}     ❍ The ETH address of the deployed vault.
  ${DESTINATION_ADDRESS_ARG}  ❍ Destination address of a token peg in.
  ${USER_DATA_ARG}      ❍ User data in hex format [default: 0x].
  ${TOKENS_ARG}  ❍ ETH addresses of tokens the vault will support.
  ${AMOUNT_ARG}              ❍ Amount of tokens in their most granular format.
  ${ORIGIN_CHAIN_ID_ARG}       ❍ Metadata chain ID of the chain this contract is deployed to.
  ${DESTINATION_CHAIN_ID_ARG}  ❍ Metadata chain ID of the chains this contract supports peg-ins to.
  ${WETH_ADDRESS_ARG}         ❍ The address for the wrapped ETH token on the blockchain to be deployed to.
  ${NETWORK_ARG}             ❍ Network the vault is deployed on. It must exist in the 'hardhat.config.json'.
`
const main = _ => {
  const CLI_ARGS = docopt(USAGE_INFO, { version })
  if (CLI_ARGS[FLATTEN_CONTRACT_CMD]) {
    return Promise.resolve(
      console.info('✘ `truffle-flattener` does not work w/ `unchecked` code blocks, so we cannot do this yet!')
    )
  } else if (CLI_ARGS[SHOW_SUGGESTED_FEES_CMD]) {
    return showSuggestedFees()
  } else if (CLI_ARGS[DEPLOY_VAULT_CMD]) {
    return deployVault()
  } else if (CLI_ARGS[DEPLOY_UNWRAPPER_CMD]) {
    return deployUnwrapperContract(CLI_ARGS[WETH_ADDRESS_ARG])
  } else if (CLI_ARGS[VERIFY_VAULT_CMD]) {
    return verifyVault(CLI_ARGS[NETWORK_ARG], CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  } else if (CLI_ARGS[VERIFY_UNWRAPPER_CMD]) {
    return verifyUnwrapper(
      CLI_ARGS[NETWORK_ARG],
      CLI_ARGS[DEPLOYED_ADDRESS_ARG],
      CLI_ARGS[WETH_ADDRESS_ARG]
    )
  } else if (CLI_ARGS[SHOW_EXISTING_CONTRACTS_CMD]) {
    return showExistingContractAddresses()
  } else if (CLI_ARGS[SET_PNETWORK_CMD]) {
    return setPNetwork(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  } else if (CLI_ARGS[ADD_SUPPORTED_TOKEN_CMD]) {
    return addSupportedToken(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  } else if (CLI_ARGS[SET_WETH_UNWRAPPER_ADDRESS]) {
    return setWEthUnwrapperAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  } else if (CLI_ARGS[GET_PNETWORK_CMD]) {
    return getPNetwork(CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  } else if (CLI_ARGS[GET_SUPPORTED_TOKENS_CMD]) {
    return getSupportedTokens(CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  } else if (CLI_ARGS[GET_WETH_ADDRESS]) {
    return getWEthAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  } else if (CLI_ARGS[IS_TOKEN_SUPPORTED_CMD]) {
    return isTokenSupported(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  } else if (CLI_ARGS[SHOW_WALLET_DETAILS_CMD]) {
    return showWalletDetails()
  } else if (CLI_ARGS[GET_ENCODED_INIT_ARGS_CMD]) {
    return getEncodedInitArgs(
      CLI_ARGS[WETH_ADDRESS_ARG],
      CLI_ARGS[TOKEN_FLAG],
      CLI_ARGS[ORIGIN_CHAIN_ID_ARG],
    )
  } else if (CLI_ARGS[PEG_IN_CMD]) {
    return pegIn(
      CLI_ARGS[DEPLOYED_ADDRESS_ARG],
      CLI_ARGS[AMOUNT_ARG],
      CLI_ARGS[TOKEN_ADDRESS_ARG],
      CLI_ARGS[DESTINATION_ADDRESS_ARG],
      CLI_ARGS[DESTINATION_CHAIN_ID_ARG],
      CLI_ARGS[USER_DATA_OPTIONAL_ARG],
    )
  }
}

main().catch(_err => console.error('✘', _err.message))
