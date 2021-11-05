const { keys } = require('ramda')

const EXISTING_LOGIC_CONTRACT_ADDRESSES = {
  'ropsten': '0x5aef0dd182344144cc63a35f3c04f143e59c1350'
}

const showExistingContractAddresses = _ =>
  new Promise(resolve =>
    keys(EXISTING_LOGIC_CONTRACT_ADDRESSES).length === 0
      ? resolve(console.info('✘ No existing deployed contract addresses yet!'))
      : resolve(console.table(EXISTING_LOGIC_CONTRACT_ADDRESSES))
  )

module.exports = { showExistingContractAddresses }
