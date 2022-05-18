const { keys } = require('ramda')

const EXISTING_LOGIC_CONTRACT_ADDRESSES = [
  { 'version': 'v2', 'chain': 'bsc', 'address': '0x73c47d9Da343328Aa744E712560D91C6de9084a0' },
  { 'version': 'v2', 'chain': 'fantomTestnet', 'address': '0x66493EA9e1a2c00A4E0d00d351834f4bcd6BEa99' },
  { 'version': 'v2', 'chain': 'fantomMainnet', 'address': '0xa90b17590AeC74265d8346bD97feAA5215407fB4' },
  { 'version': 'v1', 'chain': 'ropsten', 'address': '0x5aef0dd182344144cc63a35f3c04f143e59c1350' },
  { 'version': 'v2', 'chain': 'ropsten', 'address': '0x2Ea67a02058c3A0CE5f774949b6E8741B8D0a399' },
  { 'version': 'v2', 'chain': 'rinkeby', 'address': '0x6819bbFdf803B8b87850916d3eEB3642DdE6C24F' },
  { 'version': 'v2', 'chain': 'interim', 'address': '0xeEa7CE353a076898E35E82609e45918B5e4d0e0A' },
  { 'version': 'v2', 'chain': 'ethereum', 'address': '0xE01a9c36170b8Fa163C6a54D7aB3015C85e0186c' },
]

const showExistingContractAddresses = _ =>
  new Promise(resolve =>
    keys(EXISTING_LOGIC_CONTRACT_ADDRESSES).length === 0
      ? resolve(console.info('✘ No existing deployed contract addresses yet!'))
      : resolve(console.table(EXISTING_LOGIC_CONTRACT_ADDRESSES))
  )

module.exports = { showExistingContractAddresses }
