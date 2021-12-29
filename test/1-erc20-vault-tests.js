const {
  prop,
  find,
  values,
} = require('ramda')
const {
  ADDRESS_PROP,
  EMPTY_USER_DATA,
  ORIGIN_CHAIN_ID,
  DESTINATION_CHAIN_ID,
} = require('./test-constants')
const {
  pegOut,
  giveAllowance,
  addTokenSupport,
  assertPegInEvent,
  getRandomEthAddress,
  pegInWithoutUserData,
  getPegInEventFromReceipt,
  deployUpgradeableContract,
  deployNonUpgradeableContract,
  getEventSignatureFromEventFragment,
} = require('./test-utils')
const assert = require('assert')
const { BigNumber } = require('ethers')

describe('Erc20Vault Tests', () => {
  const TOKEN_AMOUNT = 1337
  const USER_DATA = '0x1337'
  const DESTINATION_ADDRESS = 'aneosaddress'
  const VAULT_PATH = 'contracts/Erc20Vault.sol:Erc20Vault'
  const NON_PNETWORK_ERROR = 'Caller must be PNETWORK address!'
  const ERC777_CONTRACT_PATH = 'contracts/test-contracts/Erc777Token.sol:Erc777Token'

  let PNETWORK,
    NON_PNETWORK,
    WETH_ADDRESS,
    TOKEN_HOLDER,
    WETH_CONTRACT,
    VAULT_ADDRESS,
    VAULT_CONTRACT,
    ERC777_ADDRESS,
    ERC777_CONTRACT,
    PNETWORK_ADDRESS,
    ERC20_TOKEN_ADDRESS,
    NON_PNETWORK_ADDRESS,
    TOKEN_HOLDER_ADDRESS,
    ERC20_TOKEN_CONTRACT,
    NON_OWNED_VAULT_CONTRACT

  beforeEach(async () => {
    const TOKEN_HOLDER_BALANCE = 1e6
    const signers = await ethers.getSigners()
    PNETWORK = signers[0]
    NON_PNETWORK = signers[1]
    NON_PNETWORK_ADDRESS = prop(ADDRESS_PROP, NON_PNETWORK_ADDRESS)
    PNETWORK_ADDRESS = prop(ADDRESS_PROP, PNETWORK)
    TOKEN_HOLDER = signers[1]
    TOKEN_HOLDER_ADDRESS = prop(ADDRESS_PROP, TOKEN_HOLDER)
    WETH_CONTRACT = await deployNonUpgradeableContract('contracts/wEth/WETH.sol:WETH')
    WETH_ADDRESS = prop(ADDRESS_PROP, WETH_CONTRACT)
    VAULT_CONTRACT = await deployUpgradeableContract(
      VAULT_PATH,
      [ WETH_ADDRESS, [], ORIGIN_CHAIN_ID ]
    )
    VAULT_ADDRESS = prop(ADDRESS_PROP, VAULT_CONTRACT)
    ERC20_TOKEN_CONTRACT = await deployNonUpgradeableContract('contracts/test-contracts/Erc20Token.sol:Erc20Token')
    ERC20_TOKEN_ADDRESS = prop(ADDRESS_PROP, ERC20_TOKEN_CONTRACT)
    NON_OWNED_VAULT_CONTRACT = VAULT_CONTRACT.connect(NON_PNETWORK)
    await ERC20_TOKEN_CONTRACT.transfer(TOKEN_HOLDER_ADDRESS, TOKEN_HOLDER_BALANCE)
    const tokenHolderBalance = await ERC20_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
    assert(tokenHolderBalance.eq(BigNumber.from(TOKEN_HOLDER_BALANCE)))
    ERC777_CONTRACT = await deployNonUpgradeableContract(ERC777_CONTRACT_PATH)
    ERC777_ADDRESS = prop(ADDRESS_PROP, ERC777_CONTRACT)
    await VAULT_CONTRACT.addSupportedToken(ERC777_ADDRESS)
    await ERC777_CONTRACT.send(TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, EMPTY_USER_DATA)
    await ERC777_CONTRACT.connect(TOKEN_HOLDER).approve(VAULT_ADDRESS, TOKEN_AMOUNT)
  })

  describe('Initalizer Tests', () => {
    it('Token addresses sent to constructor should be supported', async () => {
      const addresses = [ getRandomEthAddress(), getRandomEthAddress() ]
      const newVault = await deployUpgradeableContract(
        VAULT_PATH,
        [ WETH_ADDRESS, addresses, ORIGIN_CHAIN_ID ]
      )
      addresses
        .map(async _address => {
          const tokenIsSupported = await newVault.isTokenSupported(_address)
          assert(tokenIsSupported)
        })
    })
  })

  describe('Ownership Tests', () => {
    it('PNETWORK_ADDRESS can change PNETWORK_ADDRESS', async () => {
      const newPNetworkAddress = getRandomEthAddress()
      const pNetworkBefore = await VAULT_CONTRACT.PNETWORK()
      assert.strictEqual(pNetworkBefore, PNETWORK_ADDRESS)
      await VAULT_CONTRACT.setPNetwork(newPNetworkAddress)
      const pNetworkAfter = await VAULT_CONTRACT.PNETWORK()
      assert.strictEqual(pNetworkAfter, newPNetworkAddress)
    })

    it('NON_PNETWORK_ADDRESS cannot change PNETWORK_ADDRESS', async () => {
      const newPNetworkAddress = getRandomEthAddress()
      const pNetworkBefore = await NON_OWNED_VAULT_CONTRACT.PNETWORK()
      assert.strictEqual(pNetworkBefore, PNETWORK_ADDRESS)
      try {
        await NON_OWNED_VAULT_CONTRACT.setPNetwork(newPNetworkAddress)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedErr = 'Caller must be PNETWORK address!'
        assert(_err.message.includes(expectedErr))
      }
      const pNetworkAfter = await NON_OWNED_VAULT_CONTRACT.PNETWORK()
      assert.strictEqual(pNetworkAfter, pNetworkBefore)
    })

    it('Should not be able to set pNetwork address to the zero address', async () => {
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
      const pNetworkBefore = await VAULT_CONTRACT.PNETWORK()
      assert.strictEqual(pNetworkBefore, PNETWORK_ADDRESS)
      try {
        await VAULT_CONTRACT.setPNetwork(ZERO_ADDRESS)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedErr = 'Cannot set the zero address as the pNetwork address!'
        assert(_err.message.includes(expectedErr))
      }
      const pNetworkAfter = await VAULT_CONTRACT.PNETWORK()
      assert.strictEqual(pNetworkAfter, pNetworkBefore)
    })
  })

  describe('Token Approval Tests', () => {
    let tokenIsSupported

    it('PNETWORK_ADDRESS can add appoved token address', async () => {
      tokenIsSupported = await VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(!tokenIsSupported)
      await VAULT_CONTRACT.addSupportedToken(ERC20_TOKEN_ADDRESS)
      tokenIsSupported = await VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(tokenIsSupported)
    })

    it('NON_PNETWORK_ADDRESS cannot add appoved token address', async () => {
      tokenIsSupported = await VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(!tokenIsSupported)
      try {
        await NON_OWNED_VAULT_CONTRACT.addSupportedToken(ERC20_TOKEN_ADDRESS)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_PNETWORK_ERROR))
      }
      tokenIsSupported = await VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(!tokenIsSupported)
    })

    it('PNETWORK_ADDRESS can remove appoved token address', async () => {
      await VAULT_CONTRACT.addSupportedToken(ERC20_TOKEN_ADDRESS)
      tokenIsSupported = await VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(tokenIsSupported)
      await VAULT_CONTRACT.removeSupportedToken(ERC20_TOKEN_ADDRESS)
      tokenIsSupported = await VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(!tokenIsSupported)
    })

    it('NON_PNETWORK_ADDRESS cannot remove appoved token address', async () => {
      tokenIsSupported = await NON_OWNED_VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(!tokenIsSupported)
      await VAULT_CONTRACT.addSupportedToken(ERC20_TOKEN_ADDRESS)
      tokenIsSupported = await NON_OWNED_VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS)
      assert(tokenIsSupported)
      try {
        await NON_OWNED_VAULT_CONTRACT.removeSupportedToken(ERC20_TOKEN_ADDRESS)
        assert.fail('Should not have succeeded')
      } catch (_err) {
        assert(_err.message.includes(NON_PNETWORK_ERROR))
      }
    })
  })

  describe('Peg In Tests', () => {
    it('Should NOT peg in if token is not supported', async () => {
      assert(!await VAULT_CONTRACT.isTokenSupported(ERC20_TOKEN_ADDRESS))
      try {
        await pegInWithoutUserData(
          VAULT_CONTRACT,
          ERC20_TOKEN_ADDRESS,
          TOKEN_AMOUNT,
          DESTINATION_ADDRESS,
        )
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedErr = 'Token at supplied address is NOT supported!'
        assert(_err.message.includes(expectedErr))
      }
    })

    it('Should NOT peg in if token is supported but insufficient allowance approved', async () => {
      await addTokenSupport(VAULT_CONTRACT, ERC20_TOKEN_ADDRESS)
      try {
        await pegInWithoutUserData(
          VAULT_CONTRACT.connect(TOKEN_HOLDER),
          ERC20_TOKEN_ADDRESS,
          TOKEN_AMOUNT,
          DESTINATION_ADDRESS,
        )
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedErr = 'ERC20: transfer amount exceeds allowance'
        assert(_err.message.includes(expectedErr))
      }
    })

    it('Should NOT peg in supported token if sufficient allowance approved, but token amount is 0', async () => {
      const tokenAmount = 0
      await addTokenSupport(VAULT_CONTRACT, ERC20_TOKEN_ADDRESS)
      await giveAllowance(ERC20_TOKEN_CONTRACT, VAULT_ADDRESS, TOKEN_AMOUNT)
      try {
        await pegInWithoutUserData(
          VAULT_CONTRACT.connect(TOKEN_HOLDER),
          ERC20_TOKEN_ADDRESS,
          tokenAmount,
          DESTINATION_ADDRESS,
        )
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedErr = 'Token amount must be greater than zero!'
        assert(_err.message.includes(expectedErr))
      }
    })

    it('Should peg in if token & destination are supported and sufficient allowance approved', async () => {
      await addTokenSupport(VAULT_CONTRACT, ERC20_TOKEN_ADDRESS)
      await giveAllowance(ERC20_TOKEN_CONTRACT.connect(TOKEN_HOLDER), VAULT_ADDRESS, TOKEN_AMOUNT)
      const tokenHolderBalanceBeforePegIn = await ERC20_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      const vaultTokenBalanceBefore = await ERC20_TOKEN_CONTRACT.balanceOf(VAULT_ADDRESS)
      const tx = await pegInWithoutUserData(
        VAULT_CONTRACT.connect(TOKEN_HOLDER),
        ERC20_TOKEN_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS
      )
      const receipt = await tx.wait()
      assertPegInEvent(
        await getPegInEventFromReceipt(receipt),
        ERC20_TOKEN_ADDRESS,
        TOKEN_HOLDER_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS
      )
      const vaultTokenBalanceAfter = await ERC20_TOKEN_CONTRACT.balanceOf(VAULT_ADDRESS)
      const tokenHolderBalanceAfterPegIn = await ERC20_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      assert(vaultTokenBalanceAfter.eq(vaultTokenBalanceBefore.add(TOKEN_AMOUNT)))
      assert(tokenHolderBalanceAfterPegIn.eq(tokenHolderBalanceBeforePegIn.sub(TOKEN_AMOUNT)))
    })

    it('Should peg in with user data', async () => {
      await addTokenSupport(VAULT_CONTRACT, ERC20_TOKEN_ADDRESS)
      await giveAllowance(ERC20_TOKEN_CONTRACT.connect(TOKEN_HOLDER), VAULT_ADDRESS, TOKEN_AMOUNT)
      const tokenHolderBalanceBeforePegIn = await ERC20_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      const vaultTokenBalanceBefore = await ERC20_TOKEN_CONTRACT.balanceOf(VAULT_ADDRESS)
      const tx = await VAULT_CONTRACT
        .connect(TOKEN_HOLDER)['pegIn(uint256,address,string,bytes,bytes4)'](
          TOKEN_AMOUNT,
          ERC20_TOKEN_ADDRESS,
          DESTINATION_ADDRESS,
          USER_DATA,
          DESTINATION_CHAIN_ID,
        )
      const receipt = await tx.wait()
      assertPegInEvent(
        await getPegInEventFromReceipt(receipt),
        ERC20_TOKEN_ADDRESS,
        TOKEN_HOLDER_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS,
        USER_DATA,
      )
      const vaultTokenBalanceAfter = await ERC20_TOKEN_CONTRACT.balanceOf(VAULT_ADDRESS)
      const tokenHolderBalanceAfterPegIn = await ERC20_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      assert(vaultTokenBalanceAfter.eq(vaultTokenBalanceBefore.add(TOKEN_AMOUNT)))
      assert(tokenHolderBalanceAfterPegIn.eq(tokenHolderBalanceBeforePegIn.sub(TOKEN_AMOUNT)))
    })
  })

  describe('ERC777 Peg In Tests', () => {
    const PEG_IN_TAG = 'ERC777-pegIn'
    const ABI_CODEC = new ethers.utils.AbiCoder()

    it('Should peg in an ERC777 token', async () => {
      const tx = await pegInWithoutUserData(
        VAULT_CONTRACT.connect(TOKEN_HOLDER),
        ERC777_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS,
      )
      const receipt = await tx.wait()
      assertPegInEvent(
        await getPegInEventFromReceipt(receipt),
        ERC777_ADDRESS,
        TOKEN_HOLDER_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS
      )
    })

    it('Should automatically peg in on ERC777 send', async () => {
      const eventFragment = find(x => x.name === 'PegIn' && x.type === 'event', VAULT_CONTRACT.interface.fragments)
      const eventSignature = getEventSignatureFromEventFragment(eventFragment)
      const tag = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PEG_IN_TAG))
      const userData = ABI_CODEC.encode(
        [ 'bytes32', 'string', 'bytes4' ],
        [ tag, DESTINATION_ADDRESS, DESTINATION_CHAIN_ID ],
      )
      await ERC777_CONTRACT.send(TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, EMPTY_USER_DATA)
      const tx = await ERC777_CONTRACT.connect(TOKEN_HOLDER).send(VAULT_ADDRESS, TOKEN_AMOUNT, userData)
      const receipt = await tx.wait()
      const event = find(e => e.topics[0] === eventSignature, values(receipt.events))
      assert(event != null, 'PegIn event not found')
      const decodedEvent = ABI_CODEC.decode(eventFragment.inputs.map(prop('type')), event.data)
      const expectedLength = 5
      assert(decodedEvent.length, expectedLength)
      assert.strictEqual(decodedEvent[0], ERC777_ADDRESS)
      assert.strictEqual(decodedEvent[1], TOKEN_HOLDER_ADDRESS)
      assert(decodedEvent[2].eq(BigNumber.from(TOKEN_AMOUNT)))
      assert.strictEqual(decodedEvent[3], DESTINATION_ADDRESS)
      assert.strictEqual(decodedEvent[4], userData)
    })

    it('Should fail to automatically peg-in if encoded user data is incorrect', async () => {
      const tag = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PEG_IN_TAG))
      const malformedUserData = ABI_CODEC.encode([ 'bytes32', 'bytes4' ], [ tag, DESTINATION_CHAIN_ID ])
      await ERC777_CONTRACT.send(TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, EMPTY_USER_DATA)
      try {
        await ERC777_CONTRACT.connect(TOKEN_HOLDER).send(VAULT_ADDRESS, TOKEN_AMOUNT, malformedUserData)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes('reverted'))
      }
    })

    it('Should fail to automatically peg-in if encoded peg-in tag is incorrect', async () => {
      const tag = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Incorrect peg-in tag'))
      const userData = ABI_CODEC.encode(
        [ 'bytes32', 'string', 'bytes4' ],
        [ tag, DESTINATION_ADDRESS, DESTINATION_CHAIN_ID ],
      )
      await ERC777_CONTRACT.send(TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, EMPTY_USER_DATA)
      try {
        await ERC777_CONTRACT.connect(TOKEN_HOLDER).send(VAULT_ADDRESS, TOKEN_AMOUNT, userData)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedError = 'Invalid tag for automatic pegIn on ERC777 send'
        assert(_err.message.includes(expectedError))
      }
    })
  })

  describe('Peg Out Tests', () => {
    it('NON_PNETWORK_ADDRESS cannot peg out', async () => {
      await addTokenSupport(VAULT_CONTRACT, ERC20_TOKEN_ADDRESS)
      await giveAllowance(ERC20_TOKEN_CONTRACT.connect(TOKEN_HOLDER), VAULT_ADDRESS, TOKEN_AMOUNT)
      await pegInWithoutUserData(
        VAULT_CONTRACT.connect(TOKEN_HOLDER),
        ERC20_TOKEN_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS,
      )
      try {
        await pegOut(
          VAULT_CONTRACT.connect(NON_PNETWORK),
          TOKEN_HOLDER_ADDRESS,
          ERC20_TOKEN_ADDRESS,
          TOKEN_AMOUNT,
        )
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_PNETWORK_ERROR))
      }
    })

    it('PNETWORK_ADDRESS cannot peg out if insufficient balance', async () => {
      await addTokenSupport(VAULT_CONTRACT, ERC20_TOKEN_ADDRESS)
      try {
        await pegOut(VAULT_CONTRACT, TOKEN_HOLDER_ADDRESS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedErr = 'ERC20: transfer amount exceeds balance'
        assert(_err.message.includes(expectedErr))
      }
    })

    it('PNETWORK_ADDRESS can peg out with sufficient balance', async () => {
      await addTokenSupport(VAULT_CONTRACT, ERC20_TOKEN_ADDRESS)
      await giveAllowance(ERC20_TOKEN_CONTRACT.connect(TOKEN_HOLDER), VAULT_ADDRESS, TOKEN_AMOUNT)
      await pegInWithoutUserData(
        VAULT_CONTRACT.connect(TOKEN_HOLDER),
        ERC20_TOKEN_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS,
      )
      const tokenHolderBalanceBeforePegOut = await ERC20_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      await pegOut(VAULT_CONTRACT, TOKEN_HOLDER_ADDRESS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT)
      const tokenHolderBalanceAfterPegOut = await ERC20_TOKEN_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      assert(tokenHolderBalanceAfterPegOut.eq(tokenHolderBalanceBeforePegOut.add(TOKEN_AMOUNT)))
    })

    it('Can peg out with user data', async () => {
      const userData = '0xdecaff'
      await giveAllowance(ERC777_CONTRACT.connect(TOKEN_HOLDER), VAULT_ADDRESS, TOKEN_AMOUNT)
      await pegInWithoutUserData(
        VAULT_CONTRACT.connect(TOKEN_HOLDER),
        ERC777_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS,
      )
      const tokenHolderBalanceBeforePegOut = await ERC777_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      await pegOut(
        VAULT_CONTRACT,
        TOKEN_HOLDER_ADDRESS,
        ERC777_ADDRESS,
        TOKEN_AMOUNT,
        userData,
      )
      const tokenHolderBalanceAfterPegOut = await ERC777_CONTRACT.balanceOf(TOKEN_HOLDER_ADDRESS)
      assert(tokenHolderBalanceAfterPegOut.eq(tokenHolderBalanceBeforePegOut.add(TOKEN_AMOUNT)))
    })

    it('Pegging out to ERC777 recipient with user data will call tokens received hook', async () => {
      const userData = '0xdecaff'
      const ERC777_RECIPIENT_PATH = 'contracts/test-contracts/Erc777Recipient.sol:Erc777Recipient'
      await giveAllowance(ERC777_CONTRACT.connect(TOKEN_HOLDER), VAULT_ADDRESS, TOKEN_AMOUNT)
      const ERC777_RECIPIENT_CONTRACT = await deployNonUpgradeableContract(ERC777_RECIPIENT_PATH)
      const ERC777_RECIPIENT_ADDRESS = prop(ADDRESS_PROP, ERC777_RECIPIENT_CONTRACT)
      await pegInWithoutUserData(
        VAULT_CONTRACT.connect(TOKEN_HOLDER),
        ERC777_ADDRESS,
        TOKEN_AMOUNT,
        DESTINATION_ADDRESS,
      )
      const recipientBalanceBefore = await ERC777_CONTRACT.balanceOf(ERC777_RECIPIENT_ADDRESS)
      assert(!await ERC777_RECIPIENT_CONTRACT.tokenReceivedCalled())
      await pegOut(
        VAULT_CONTRACT,
        ERC777_RECIPIENT_ADDRESS,
        ERC777_ADDRESS,
        TOKEN_AMOUNT,
        userData,
      )
      const recipientBalanceAfter = await ERC777_CONTRACT.balanceOf(ERC777_RECIPIENT_ADDRESS)
      assert(recipientBalanceAfter.eq(recipientBalanceBefore.add(TOKEN_AMOUNT)))
      assert(await ERC777_RECIPIENT_CONTRACT.tokenReceivedCalled())
      const userDataFromRecipient = await ERC777_RECIPIENT_CONTRACT.tokensReceivedData()
      assert.strictEqual(userDataFromRecipient, userData)
    })
  })

  describe('wETH Tests', () => {
    beforeEach(async () => {
      await addTokenSupport(VAULT_CONTRACT, WETH_ADDRESS)
    })

    describe('Peg In wETH Tests', () => {
      it('Should peg in wETH', async () => {
        const tx = await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          { value: TOKEN_AMOUNT }
        )
        const receipt = await tx.wait()
        assertPegInEvent(
          await getPegInEventFromReceipt(receipt),
          WETH_ADDRESS,
          TOKEN_HOLDER_ADDRESS,
          TOKEN_AMOUNT,
          DESTINATION_ADDRESS
        )
        const vaultWethBalanceAfter = await WETH_CONTRACT.balanceOf(VAULT_ADDRESS)
        const vaultEthBalanceAfter = await ethers.provider.getBalance(VAULT_ADDRESS)
        assert(vaultWethBalanceAfter.eq(TOKEN_AMOUNT))
        assert(vaultEthBalanceAfter.eq(0))
      })

      it('Should peg in wETH with user data', async () => {
        const tx = await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4,bytes)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          USER_DATA,
          { value: TOKEN_AMOUNT }
        )
        const receipt = await tx.wait()
        assertPegInEvent(
          await getPegInEventFromReceipt(receipt),
          WETH_ADDRESS,
          TOKEN_HOLDER_ADDRESS,
          TOKEN_AMOUNT,
          DESTINATION_ADDRESS,
          USER_DATA,
        )
        const vaultWethBalanceAfter = await WETH_CONTRACT.balanceOf(VAULT_ADDRESS)
        const vaultEthBalanceAfter = await ethers.provider.getBalance(VAULT_ADDRESS)
        assert(vaultWethBalanceAfter.eq(TOKEN_AMOUNT))
        assert(vaultEthBalanceAfter.eq(0))
      })
    })

    describe('Peg Out wETH Tests', () => {
      it('Should peg out wETH without user data', async () => {
        await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          { value: TOKEN_AMOUNT },
        )
        const tokenHolderEthBalanceBefore = await ethers.provider.getBalance(TOKEN_HOLDER_ADDRESS)
        await pegOut(VAULT_CONTRACT, TOKEN_HOLDER_ADDRESS, WETH_ADDRESS, TOKEN_AMOUNT)
        const vaultWethBalanceAfter = await WETH_CONTRACT.balanceOf(VAULT_ADDRESS)
        const vaultEthBalanceAfter = await ethers.provider.getBalance(VAULT_ADDRESS)
        const expectedTokenHolderEthBalance = BigNumber.from(tokenHolderEthBalanceBefore).add(TOKEN_AMOUNT)
        const tokenHolderEthBalance = await ethers.provider.getBalance(TOKEN_HOLDER_ADDRESS)
        assert(vaultEthBalanceAfter.eq(0))
        assert(vaultWethBalanceAfter.eq(0))
        assert(tokenHolderEthBalance.eq(expectedTokenHolderEthBalance))
      })

      it('Should peg out wETH with user data', async () => {
        await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          { value: TOKEN_AMOUNT }
        )
        const tokenHolderEthBalanceBefore = await ethers.provider.getBalance(TOKEN_HOLDER_ADDRESS)
        await pegOut(VAULT_CONTRACT, TOKEN_HOLDER_ADDRESS, WETH_ADDRESS, TOKEN_AMOUNT, USER_DATA)
        const vaultWethBalanceAfter = await WETH_CONTRACT.balanceOf(VAULT_ADDRESS)
        const vaultEthBalanceAfterPegOut = await ethers.provider.getBalance(VAULT_ADDRESS)
        const expectedTokenHolderEthBalance = BigNumber.from(tokenHolderEthBalanceBefore).add(TOKEN_AMOUNT)
        const tokenHolderEthBalanceAfter = await ethers.provider.getBalance(TOKEN_HOLDER_ADDRESS)
        assert(vaultWethBalanceAfter.eq(0))
        assert(vaultEthBalanceAfterPegOut.eq(0))
        assert(tokenHolderEthBalanceAfter.eq(expectedTokenHolderEthBalance))
      })

      it('Should peg out wETH to smart-contract w/ expensive fallback function', async () => {
        const PEG_OUT_GAS_LIMIT = 450e3
        /* eslint-disable-next-line max-len */
        const PATH = 'contracts/test-contracts/ContractWithExpensiveFallbackFunction.sol:ContractWithExpensiveFallbackFunction'
        const expensiveFallbackContract = await deployNonUpgradeableContract(PATH)
        const expensiveFallbackContractAddress = prop(ADDRESS_PROP, expensiveFallbackContract)
        const expensiveContractEthBalanceBeforePegout = await ethers.provider.getBalance(
          expensiveFallbackContractAddress
        )
        assert(expensiveContractEthBalanceBeforePegout.eq(0))
        await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          { value: TOKEN_AMOUNT }
        )
        await pegOut(
          VAULT_CONTRACT,
          expensiveFallbackContractAddress,
          WETH_ADDRESS,
          TOKEN_AMOUNT,
          EMPTY_USER_DATA,
          PEG_OUT_GAS_LIMIT,
        )
        const vaultWethBalanceAfter = await WETH_CONTRACT.balanceOf(VAULT_ADDRESS)
        assert(vaultWethBalanceAfter.eq(0))
        const expensiveContractEthBalanceAfterPegout = await ethers.provider.getBalance(
          expensiveFallbackContractAddress
        )
        assert(expensiveContractEthBalanceAfterPegout.eq(TOKEN_AMOUNT))
        const vaultEthBalanceAfterPegOut = await ethers.provider.getBalance(VAULT_ADDRESS)
        assert(vaultEthBalanceAfterPegOut.eq(0))
      })

      it('Should be able to peg out wETH with user data to a smart-contract', async () => {
        const userData = '0xdecaff'
        const ERC777_RECIPIENT_PATH = 'contracts/test-contracts/Erc777Recipient.sol:Erc777Recipient'
        await giveAllowance(ERC777_CONTRACT.connect(TOKEN_HOLDER), VAULT_ADDRESS, TOKEN_AMOUNT)
        const ERC777_RECIPIENT_CONTRACT = await deployNonUpgradeableContract(ERC777_RECIPIENT_PATH)
        const ERC777_RECIPIENT_ADDRESS = prop(ADDRESS_PROP, ERC777_RECIPIENT_CONTRACT)
        await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          { value: TOKEN_AMOUNT }
        )
        const recipientBalanceBefore = await ERC777_CONTRACT.balanceOf(ERC777_RECIPIENT_ADDRESS)
        assert(!await ERC777_RECIPIENT_CONTRACT.tokenReceivedCalled())
        const PEG_OUT_GAS_LIMIT = 450e3
        await pegOut(
          VAULT_CONTRACT,
          ERC777_RECIPIENT_ADDRESS,
          WETH_ADDRESS,
          TOKEN_AMOUNT,
          userData,
          PEG_OUT_GAS_LIMIT
        )
        const recipientBalanceAfter = await ethers.provider.getBalance(ERC777_RECIPIENT_ADDRESS)
        const userDataFromRecipient = await ERC777_RECIPIENT_CONTRACT.fallbackFunctionCallData()
        assert(recipientBalanceAfter.eq(recipientBalanceBefore.add(TOKEN_AMOUNT)))
        assert.strictEqual(userDataFromRecipient, userData)
      })

      it('Should not fail to peg out wETH with user data to an EOA', async () => {
        const userData = '0xdecaff'
        await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          { value: TOKEN_AMOUNT }
        )
        const tokenHolderEthBalanceBefore = await ethers.provider.getBalance(TOKEN_HOLDER_ADDRESS)
        await pegOut(VAULT_CONTRACT, TOKEN_HOLDER_ADDRESS, WETH_ADDRESS, TOKEN_AMOUNT, userData)
        const vaultWethBalanceAfter = await WETH_CONTRACT.balanceOf(VAULT_ADDRESS)
        assert(vaultWethBalanceAfter.eq(0))
        const vaultEthBalanceAfterPegOut = await ethers.provider.getBalance(VAULT_ADDRESS)
        assert(vaultEthBalanceAfterPegOut.eq(0))
        const expectedTokenHolderEthBalance = BigNumber.from(tokenHolderEthBalanceBefore).add(TOKEN_AMOUNT)
        const tokenHolderEthBalanceAfter = await ethers.provider.getBalance(TOKEN_HOLDER_ADDRESS)
        assert(tokenHolderEthBalanceAfter.eq(expectedTokenHolderEthBalance))
      })

      it('Pegging out wETH Should not be susceptible to re-entrancy attack', async () => {
        const calldata = new ethers.utils.Interface([ 'function attempReEntrancyAttack()' ])
          .encodeFunctionData('attempReEntrancyAttack', [])
        const CONTRACT_PATH = 'contracts/test-contracts/ContractWithReEntrancyAttack.sol:ContractWithReEntrancyAttack'
        const reEntrancyAttackContract = await deployNonUpgradeableContract(CONTRACT_PATH)
        const reEntrancyAttackContractAddress = prop(ADDRESS_PROP, reEntrancyAttackContract)
        const reEntrancyAttackContractEthBalanceBeforePegout = await ethers.provider.getBalance(
          reEntrancyAttackContractAddress
        )
        assert(reEntrancyAttackContractEthBalanceBeforePegout.eq(0))
        await VAULT_CONTRACT.connect(TOKEN_HOLDER)['pegInEth(string,bytes4)'](
          DESTINATION_ADDRESS,
          DESTINATION_CHAIN_ID,
          { value: TOKEN_AMOUNT }
        )
        try {
          await pegOut(VAULT_CONTRACT, reEntrancyAttackContractAddress, WETH_ADDRESS, TOKEN_AMOUNT, calldata)
          assert.fail('Should not have succeeded!')
        } catch (_err) {
          const expectedError = 'ETH transfer failed when pegging out wETH!'
          assert(_err.message.includes(expectedError))
        }
        const vaultWethBalanceAfter = await WETH_CONTRACT.balanceOf(VAULT_ADDRESS)
        assert(vaultWethBalanceAfter.eq(TOKEN_AMOUNT))
        const attackContractBalanceAfter = await ethers.provider.getBalance(
          reEntrancyAttackContractAddress
        )
        assert(attackContractBalanceAfter.eq(0))
        const vaultEthBalanceAfterPegOut = await ethers.provider.getBalance(VAULT_ADDRESS)
        assert(vaultEthBalanceAfterPegOut.eq(0))
      })
    })
  })
})
