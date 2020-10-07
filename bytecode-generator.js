#!/usr/bin/env node

const { docopt } = require('docopt')
const { version } = require('./package.json')
const { generateBytecode } = require('./lib/generate-bytecode')

const HELP_ARG = '--help'
const GENERATE_CMD = 'generate'
const VERSION_ARG = '--version'
const WETH_ADDRESS_ARG = '<wethAddress>'
const TOKEN_ADDRESSES_ARGS = '<tokenAddress>'

const USAGE_INFO = `
❍ pERC20 Contract Bytecode Generator:

  Copyright Provable Things 2020
  Author: Greg Kapka
  Questions: greg@oraclize.it

❍ Info:

A tool to generate the bytecode for the pERC20 ethereum smart-contract.

❍ Usage:
  ./bytecode-generator.js ${HELP_ARG}
  ./bytecode-generator.js ${VERSION_ARG}
  ./bytecode-generator.js ${GENERATE_CMD} ${WETH_ADDRESS_ARG} [${TOKEN_ADDRESSES_ARGS}]...

❍ Commands:

  ${GENERATE_CMD}              ❍ Generate the pERC20 bytecode.

❍ Options:
    ${HELP_ARG}              ❍ Show this message.
    ${VERSION_ARG}           ❍ Show version information.
    ${WETH_ADDRESS_ARG}       ❍ The address of the wrapped ETH (wETH) token contract.
    ${TOKEN_ADDRESSES_ARGS}      ❍ The addresses of any token contracts you want supporting on contract creation.
`

const main = _ => {
  const CLI_ARGS = docopt(USAGE_INFO, { version })
  if (CLI_ARGS[GENERATE_CMD])
    return generateBytecode(CLI_ARGS[WETH_ADDRESS_ARG], CLI_ARGS[TOKEN_ADDRESSES_ARGS])
  else
    return console.info(USAGE_INFO)
}

main()
