const { keys } = require('ramda')

const EXISTING_LOGIC_CONTRACT_ADDRESSES = [
  { 'version': 'v1', 'chain': 'ropsten', 'address': '0x5aef0dd182344144cc63a35f3c04f143e59c1350'},
  { 'version': 'v2', 'chain': 'ropsten', 'address': '0x2Ea67a02058c3A0CE5f774949b6E8741B8D0a399'},
  { 'version': 'v2', 'chain': 'rinkeby', 'address': '0x6819bbFdf803B8b87850916d3eEB3642DdE6C24F'},
  { 'version': 'v2', 'chain': 'ethMainnet', 'address': '0xE01a9c36170b8Fa163C6a54D7aB3015C85e0186c'},
  { 'version': 'v2', 'chain': 'interim', 'address': '0xeEa7CE353a076898E35E82609e45918B5e4d0e0A'},
]

const showExistingContractAddresses = _ =>
  new Promise(resolve =>
    keys(EXISTING_LOGIC_CONTRACT_ADDRESSES).length === 0
      ? resolve(console.info('✘ No existing deployed contract addresses yet!'))
      : resolve(console.table(EXISTING_LOGIC_CONTRACT_ADDRESSES))
  )

module.exports = { showExistingContractAddresses }
