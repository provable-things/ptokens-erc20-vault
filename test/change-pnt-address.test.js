const {
  getRandomEthAddress,
  deployUpgradeableContract,
} = require('./test-utils')
const assert = require('assert')
const { ZERO_ADDRESS } = require('./test-constants')

describe('Change PNT Address', () => {
  const SAMPLE_PNT_ADDRESS = getRandomEthAddress(ethers)
  const SAMPLE_ORIGIN_CHAIN_ID = '0x00000000'
  const VAULT_PATH = 'contracts/Erc20Vault.sol:Erc20Vault'

  let NON_PNETWORK, VAULT_CONTRACT, NON_OWNED_VAULT_CONTRACT

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    NON_PNETWORK = signers[1]
    const dummyWethAddress = getRandomEthAddress(ethers)
    VAULT_CONTRACT = await deployUpgradeableContract(
      VAULT_PATH,
      [ dummyWethAddress, [], SAMPLE_ORIGIN_CHAIN_ID ]
    )
    NON_OWNED_VAULT_CONTRACT = VAULT_CONTRACT.connect(NON_PNETWORK)
  })

  it('pNetwork can change PNT address', async () => {
    assert.strictEqual(await VAULT_CONTRACT.PNT_TOKEN_ADDRESS(), ZERO_ADDRESS)
    await VAULT_CONTRACT.changePntTokenAddress(SAMPLE_PNT_ADDRESS)
    assert.strictEqual(await VAULT_CONTRACT.PNT_TOKEN_ADDRESS(), SAMPLE_PNT_ADDRESS)
  })

  it('Non pNetwork cannot change PNT address', async () => {
    assert.strictEqual(await VAULT_CONTRACT.PNT_TOKEN_ADDRESS(), ZERO_ADDRESS)
    try {
      await NON_OWNED_VAULT_CONTRACT.changePntTokenAddress(SAMPLE_PNT_ADDRESS)
      assert.fail('Should not have succeeded!')
    } catch (_err) {
      const expectedErr = 'Caller must be PNETWORK address!'
      assert(_err.message.includes(expectedErr))
    }
  })
})
