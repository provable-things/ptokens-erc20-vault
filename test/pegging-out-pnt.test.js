const {
  getRandomEthAddress,
  deployUpgradeableContract,
  deployNonUpgradeableContract,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { ADDRESS_PROP } = require('./test-constants')

// NOTE/FIXME This test is skipped because the PNT and EthPNT in the contract are hardcoded now. Initially
// they were editable by the pNetwork address, however this presented a possible attack surface. Instead,
// those addresses are now constants, (which in solidity do not take up a storage slot) since they're
// known ahead of time. However this now makes testing this behaviour difficult. One option is to do some
// trickery where we deploy two tokens, then re-write the contract (for tests only) on the fly, replacing
// the hardcoded constant addresses.
describe.skip('Pegging Out PNT Tests', () => {
  const VAULT_TOKEN_APPROVAL_AMOUNT = 1e6
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

    // NOTE: Add the EthPNT token as a supported token in the vault...
    await VAULT_CONTRACT.addSupportedToken(ETHPNT_TOKEN_ADDRESS)
    assert(await VAULT_CONTRACT.isTokenSupported(ETHPNT_TOKEN_ADDRESS))

    // NOTE approve the vault to spend the EthPNT tokens the token holder holds, so they can be pegged in...
    await ETHPNT_TOKEN_CONTRACT
      .connect(TOKEN_HOLDER)
      .approve(VAULT_CONTRACT_ADDRESS, VAULT_TOKEN_APPROVAL_AMOUNT)

    // NOTE: Set the PNT & EthPNT token addresses correctly in the vault...
    await VAULT_CONTRACT.changePntTokenAddress(PNT_TOKEN_ADDRESS)
    await VAULT_CONTRACT.changeEthPntTokenAddress(ETHPNT_TOKEN_ADDRESS)
    assert.strictEqual(await VAULT_CONTRACT.PNT_TOKEN_ADDRESS(), PNT_TOKEN_ADDRESS)
    assert.strictEqual(await VAULT_CONTRACT.ETHPNT_TOKEN_ADDRESS(), ETHPNT_TOKEN_ADDRESS)
  })

  it('Should peg out PNT entirely in PNT if vault PNT balance is sufficient', async () => {
    const pegOutAmount = 1337

    // NOTE: Give the vault sufficient balance of the PNT token for our pegout....
    PNT_TOKEN_CONTRACT.transfer(VAULT_CONTRACT_ADDRESS, pegOutAmount * 2)

    // NOTE: Assert the vault's balances before...
    const vaultPntBalanceBefore = await PNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    const vaultEthPntBalanceBefore = await ETHPNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    assert(vaultPntBalanceBefore.eq(pegOutAmount * 2))
    assert(vaultEthPntBalanceBefore.eq(0))

    // NOTE: Assert the token holder's balances before...
    const tokenHolderPntBalanceBefore = await PNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    const tokenHolderEthPntBalanceBefore = await ETHPNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderPntBalanceBefore.eq(0))
    assert(tokenHolderEthPntBalanceBefore.eq(0))

    // NOTE: We have to call the `pegOut` fxn this way because its overloaded in the contract...
    await VAULT_CONTRACT['pegOut(address,address,uint256)'](
      TOKEN_HOLDER_ADDRESS,
      PNT_TOKEN_ADDRESS,
      pegOutAmount,
    )

    // Assert the vault balances have changed as expected...
    const vaultPntBalanceAfter = await PNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    const vaultEthPntBalanceAfter = await ETHPNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    assert(vaultPntBalanceAfter.eq(vaultPntBalanceBefore - pegOutAmount))
    assert(vaultEthPntBalanceAfter.eq(0))

    // NOTE: Assert the token holder's balances have changed as expected
    const tokenHolderPntBalanceAfter = await PNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    const tokenHolderEthPntBalanceAfter = await ETHPNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderPntBalanceAfter.eq(pegOutAmount))
    assert(tokenHolderEthPntBalanceAfter.eq(0))
  })

  it('Should peg out PNT entirely in EthPNT if vault PNT balance is zero', async () => {
    const pegOutAmount = 1337

    // NOTE: Give the vault sufficient balance of the EthPNT token for our pegout....
    ETHPNT_TOKEN_CONTRACT.transfer(VAULT_CONTRACT_ADDRESS, pegOutAmount * 2)

    // NOTE: Assert the vault's balances before...
    const vaultPntBalanceBefore = await PNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    const vaultEthPntBalanceBefore = await ETHPNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    assert(vaultPntBalanceBefore.eq(0))
    assert(vaultEthPntBalanceBefore.eq(pegOutAmount * 2))

    // NOTE: Assert the token holder's balances before...
    const tokenHolderPntBalanceBefore = await PNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    const tokenHolderEthPntBalanceBefore = await ETHPNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderPntBalanceBefore.eq(0))
    assert(tokenHolderEthPntBalanceBefore.eq(0))

    // NOTE: We have to call the `pegOut` fxn this way because its overloaded in the contract...
    await VAULT_CONTRACT['pegOut(address,address,uint256)'](
      TOKEN_HOLDER_ADDRESS,
      PNT_TOKEN_ADDRESS,
      pegOutAmount,
    )

    // Assert the vault balances have changed as expected...
    const vaultPntBalanceAfter = await PNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    const vaultEthPntBalanceAfter = await ETHPNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    assert(vaultPntBalanceAfter.eq(0))
    assert(vaultEthPntBalanceAfter.eq(vaultEthPntBalanceBefore - pegOutAmount))

    // NOTE: Assert the token holder's balances have changed as expected
    const tokenHolderPntBalanceAfter = await PNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    const tokenHolderEthPntBalanceAfter = await ETHPNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderPntBalanceAfter.eq(0))
    assert(tokenHolderEthPntBalanceAfter.eq(pegOutAmount))
  })

  it('Should peg out PNT in both PNT & EthPNT if vault PNT balance is not sufficient but not zero', async () => {
    const pegOutAmount = 1337
    const insufficientPntAmount = Math.floor(pegOutAmount / 2)
    const expectedEthPntAmount = pegOutAmount - insufficientPntAmount

    // NOTE: Give the vault insufficient balance of the PNT token for our pegout....
    PNT_TOKEN_CONTRACT.transfer(VAULT_CONTRACT_ADDRESS, insufficientPntAmount)

    // NOTE: Give the vault some balance of the EthPNT token to complete our pegout....
    ETHPNT_TOKEN_CONTRACT.transfer(VAULT_CONTRACT_ADDRESS, pegOutAmount * 2)

    // NOTE: Assert the vault's balances before...
    const vaultPntBalanceBefore = await PNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    const vaultEthPntBalanceBefore = await ETHPNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    assert(vaultPntBalanceBefore.eq(insufficientPntAmount))
    assert(vaultEthPntBalanceBefore.eq(pegOutAmount * 2))

    // NOTE: Assert the token holder's balances before...
    const tokenHolderPntBalanceBefore = await PNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    const tokenHolderEthPntBalanceBefore = await ETHPNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderPntBalanceBefore.eq(0))
    assert(tokenHolderEthPntBalanceBefore.eq(0))

    // NOTE: We have to call the `pegOut` fxn this way because its overloaded in the contract...
    await VAULT_CONTRACT['pegOut(address,address,uint256)'](TOKEN_HOLDER_ADDRESS, PNT_TOKEN_ADDRESS, pegOutAmount)

    // Assert the vault balances have changed as expected...
    const vaultPntBalanceAfter = await PNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    const vaultEthPntBalanceAfter = await ETHPNT_TOKEN_CONTRACT.balanceOf(VAULT_CONTRACT_ADDRESS)
    assert(vaultPntBalanceAfter.eq(0))
    assert(vaultEthPntBalanceAfter.eq(vaultEthPntBalanceBefore - expectedEthPntAmount))

    // NOTE: Assert the token holder's balances have changed as expected
    const tokenHolderPntBalanceAfter = await PNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    const tokenHolderEthPntBalanceAfter = await ETHPNT_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderPntBalanceAfter.eq(insufficientPntAmount))
    assert(tokenHolderEthPntBalanceAfter.eq(expectedEthPntAmount))
  })
})
