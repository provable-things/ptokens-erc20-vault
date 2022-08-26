const {
  ORIGIN_CHAIN_ID,
  DESTINATION_CHAIN_ID,
} = require('./test-constants')
const assert = require('assert')
const { deployUpgradeableContract } = require('./test-utils')

describe('Change Chain ID Tests', () => {
  const VAULT_PATH = 'contracts/Erc20Vault.sol:Erc20Vault'

  let NON_PNETWORK,
    VAULT_CONTRACT,
    NON_OWNED_VAULT_CONTRACT

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    NON_PNETWORK = signers[1]
    const dummyWethAddress = signers[3].address
    VAULT_CONTRACT = await deployUpgradeableContract(
      VAULT_PATH,
      [ dummyWethAddress, [], ORIGIN_CHAIN_ID ]
    )
    NON_OWNED_VAULT_CONTRACT = VAULT_CONTRACT.connect(NON_PNETWORK)
  })

  it('pNetwork can change origin chain ID', async () => {
    assert.strictEqual(await VAULT_CONTRACT.ORIGIN_CHAIN_ID(), ORIGIN_CHAIN_ID)
    assert.notStrictEqual(ORIGIN_CHAIN_ID, DESTINATION_CHAIN_ID)
    await VAULT_CONTRACT.changeOriginChainId(DESTINATION_CHAIN_ID)
    assert.strictEqual(await VAULT_CONTRACT.ORIGIN_CHAIN_ID(), DESTINATION_CHAIN_ID)
  })

  it('Non pNetwork cannot change origin chain ID', async () => {
    assert.strictEqual(await VAULT_CONTRACT.ORIGIN_CHAIN_ID(), ORIGIN_CHAIN_ID)
    try {
      await NON_OWNED_VAULT_CONTRACT.changeOriginChainId(DESTINATION_CHAIN_ID)
      assert.fail('Should not have succeeded!')
    } catch (_err) {
      const expectedErr = 'Caller must be PNETWORK address!'
      assert(_err.message.includes(expectedErr))
    }
  })
})
