const {
  getRandomEthAddress,
  deployUpgradeableContract,
  deployNonUpgradeableContract,
} = require('./test-utils')
const {
  ZERO_ADDRESS,
  ADDRESS_PROP,
} = require('./test-constants')
const assert = require('assert')
const { prop } = require('ramda')
const { BigNumber } = require('ethers')

// NOTE/FIXME This test is skipped because the PNT and EthPNT in the contract are hardcoded now. Initially
// they were editable by the pNetwork address, however this presented a possible attack surface. Instead,
// those addresses are now constants, (which in solidity do not take up a storage slot) since they're
// known ahead of time. However this now makes testing this behaviour difficult. One option is to do some
// trickery where we deploy two tokens, then re-write the contract (for tests only) on the fly, replacing
// the hardcoded constant addresses.
describe.skip('Pegging In EthPNT Tests', () => {
  const SAMPLE_ORIGIN_CHAIN_ID = '0x00000000'
  const VAULT_PATH = 'contracts/Erc20Vault.sol:Erc20Vault'

  let TOKEN_HOLDER,
    VAULT_CONTRACT,
    PNT_TOKEN_ADDRESS,
    PNT_TOKEN_CONTRACT,
    TOKEN_HOLDER_ADDRESS,
    ETHPNT_TOKEN_ADDRESS,
    ETHPNT_TOKEN_CONTRACT,
    VAULT_CONTRACT_ADDRESS

  beforeEach(async () => {
    const TOKEN_HOLDER_BALANCE = 1e6
    const signers = await ethers.getSigners()
    const WETH_ADDRESS = getRandomEthAddress()

    // NOTE: Create a token holder for us to play with..
    TOKEN_HOLDER = signers[1]
    TOKEN_HOLDER_ADDRESS = prop(ADDRESS_PROP, TOKEN_HOLDER)

    // NOTE: Deploy the vault contract itself...
    VAULT_CONTRACT = await deployUpgradeableContract(VAULT_PATH, [ WETH_ADDRESS, [], SAMPLE_ORIGIN_CHAIN_ID ])
    VAULT_CONTRACT_ADDRESS = prop(ADDRESS_PROP, VAULT_CONTRACT)

    // Deploy two contracts to mock the PNT and ETHPNT tokens...
    PNT_TOKEN_CONTRACT = await deployNonUpgradeableContract('contracts/test-contracts/Erc20Token.sol:Erc20Token')
    ETHPNT_TOKEN_CONTRACT = await deployNonUpgradeableContract('contracts/test-contracts/Erc20Token.sol:Erc20Token')
    PNT_TOKEN_ADDRESS = prop(ADDRESS_PROP, PNT_TOKEN_CONTRACT)
    ETHPNT_TOKEN_ADDRESS = prop(ADDRESS_PROP, ETHPNT_TOKEN_CONTRACT)

    // NOTE: Supply our token holder with some ETHPNT to peg in...
    await ETHPNT_TOKEN_CONTRACT.transfer(TOKEN_HOLDER_ADDRESS, TOKEN_HOLDER_BALANCE)

    // NOTE: Assert that the holder actually has those tokens...
    let tokenHolderEthPntBalance = await ETHPNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderEthPntBalance.eq(BigNumber.from(TOKEN_HOLDER_BALANCE)))

    // NOTE: Add the EthPNT token as a supported token in the vault...
    await VAULT_CONTRACT.addSupportedToken(ETHPNT_TOKEN_ADDRESS)
    assert(await VAULT_CONTRACT.isTokenSupported(ETHPNT_TOKEN_ADDRESS))

    // NOTE approve the vault to spend the EthPNT tokens the token holder holds, so they can be pegged in...
    await ETHPNT_TOKEN_CONTRACT.connect(TOKEN_HOLDER).approve(VAULT_CONTRACT_ADDRESS, TOKEN_HOLDER_BALANCE)

    // NOTE: Set the PNT & EthPNT token addresses correctly in the vault...
    await VAULT_CONTRACT.changePntTokenAddress(PNT_TOKEN_ADDRESS)
    await VAULT_CONTRACT.changeEthPntTokenAddress(ETHPNT_TOKEN_ADDRESS)
    assert.strictEqual(await VAULT_CONTRACT.PNT_TOKEN_ADDRESS(), PNT_TOKEN_ADDRESS)
    assert.strictEqual(await VAULT_CONTRACT.ETHPNT_TOKEN_ADDRESS(), ETHPNT_TOKEN_ADDRESS)
  })

  it('Pegging in EthPNT token should fire event with token address as PNT token', async () => {
    const tokenAmount = 1337
    const destinationAddress = getRandomEthAddress()
    const userData = '0xc0ffee'
    const destinationChainId = '0xffffffff'

    // NOTE: We have to call the fxn this way because its overloaded in the contract...
    const tx = await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegIn(uint256,address,string,bytes,bytes4)'](
      tokenAmount,
      ETHPNT_TOKEN_ADDRESS,
      destinationAddress,
      userData,
      destinationChainId,
    )
    const txReceipt = await tx.wait()
    const expectedNumEvents = 3
    assert.strictEqual(txReceipt.events.length, expectedNumEvents)
    const pegInEvent = txReceipt.events[expectedNumEvents - 1]

    // NOTE: Assert the event args...
    assert.strictEqual(pegInEvent.args[0], PNT_TOKEN_ADDRESS) // NOTE: This is the one we care about here!
    assert.strictEqual(pegInEvent.args[1], TOKEN_HOLDER_ADDRESS)
    assert(pegInEvent.args[2].eq(tokenAmount))
    assert.strictEqual(pegInEvent.args[3], destinationAddress)
    assert.strictEqual(pegInEvent.args[4], userData)
    assert.strictEqual(pegInEvent.args[5], SAMPLE_ORIGIN_CHAIN_ID)
    assert.strictEqual(pegInEvent.args[6], destinationChainId)
  })

  it('Should fail to peg in if `PNT_TOKEN_ADDRESS` is set to zero', async () => {
    await VAULT_CONTRACT.changePntTokenAddress(ZERO_ADDRESS)
    assert.strictEqual(await VAULT_CONTRACT.PNT_TOKEN_ADDRESS(), ZERO_ADDRESS)

    const tokenAmount = 1337
    const destinationAddress = getRandomEthAddress()
    const userData = '0xc0ffee'
    const destinationChainId = '0xffffffff'

    try {
      await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegIn(uint256,address,string,bytes,bytes4)'](
        tokenAmount,
        ETHPNT_TOKEN_ADDRESS,
        destinationAddress,
        userData,
        destinationChainId,
      )
      assert.fail('Should not have succeeded!')
    } catch (_err) {
      const expectedError = '`PNT_TOKEN_ADDRESS` is set to zero address!'
      assert(_err.message.includes(expectedError))
    }
  })
})
