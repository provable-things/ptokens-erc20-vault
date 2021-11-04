/* eslint-disable no-undef */
const assert = require('assert')
const { prop, find, values } = require('ramda')
const WETH_ARTIFACT = artifacts.require('WETH')
const ERC20_ARTIFACT = artifacts.require('ERC20_TOKEN')
const ERC777_ARTIFACT = artifacts.require('ERC777_TOKEN')
const VaultArtifact = artifacts.require('Erc20Vault')
const { expectRevert } = require('@openzeppelin/test-helpers')
const CONTRACT_WITH_RE_ENTRANCY_ATTACK_ARTIFACT = artifacts.require('CONTRACT_WITH_RE_ENTRANCY_ATTACK')
const CONTRACT_WITH_EXPENSIVE_FALLBACK_FXN_ARTIFACT = artifacts.require('CONTRACT_WITH_EXPENSIVE_FALLBACK_FXN')

const GAS_LIMIT = 3e6

const getContract = (_web3, _artifact, _constructorParams = []) =>
  new Promise((resolve, reject) =>
    _artifact
      .new(..._constructorParams)
      .then(({ contract: { _jsonInterface, _address } }) => resolve(new _web3.eth.Contract(_jsonInterface, _address)))
      .catch(reject)
  )

const getRandomEthAddress = _web3 =>
  _web3.utils.randomHex(20)

const addTokenSupport = (_vaultMethods, _tokenAddress, _from, _gasLimit = GAS_LIMIT) =>
  _vaultMethods.addSupportedToken(_tokenAddress).send({ from: _from, gas: _gasLimit })

const giveVaultAllowance = (_tokenMethods, _holderAddress, _spenderAddress, _tokenAmount, _gasLimit = GAS_LIMIT) =>
  _tokenMethods.approve(_spenderAddress, _tokenAmount).send({ from: _holderAddress, gas: _gasLimit })

const assertPegInEvent = (
  _pegInEvent,
  _tokenAddress,
  _tokenSender,
  _tokenAmount,
  _destinationAddress,
  _userData = null,
) => {
  assert.strictEqual(_pegInEvent.returnValues._tokenAddress, _tokenAddress)
  assert.strictEqual(_pegInEvent.returnValues._tokenSender, _tokenSender)
  assert.strictEqual(_pegInEvent.returnValues._tokenAmount, `${_tokenAmount}`)
  assert.strictEqual(_pegInEvent.returnValues._destinationAddress, _destinationAddress)
  assert.strictEqual(_pegInEvent.returnValues._userData, _userData)
}

const pegIn = (_vaultMethods, _tokenAddress, _tokenAmount, _tokenHolder, _destinationAddress, _gasLimit = GAS_LIMIT) =>
  _vaultMethods
    .pegIn(_tokenAmount, _tokenAddress, _destinationAddress)
    .send({ from: _tokenHolder, gas: _gasLimit })

const pegInWithUserData = (
  _vaultMethods,
  _tokenAddress,
  _tokenAmount,
  _tokenHolder,
  _destinationAddress,
  _userData,
  _gasLimit = GAS_LIMIT
) =>
  _vaultMethods['pegIn(uint256,address,string,bytes)'](_tokenAmount, _tokenAddress, _destinationAddress, _userData)
    .send({ from: _tokenHolder, gas: _gasLimit })

const maybeStripHexPrefix = _s => _s.toLowerCase().startsWith('0x') ? _s.slice(2) : _s

contract('Erc20Vault', ([PNETWORK_ADDRESS, NON_PNETWORK_ADDRESS, TOKEN_HOLDER_ADDRESS, ...ACCOUNTS]) => {
  const TOKEN_AMOUNT = 1337
  const USER_DATA = '0x1337'
  const TOKEN_HOLDER_BALANCE = 1e6
  const DESTINATION_ADDRESS = 'aneosaddress'
  const NON_PNETWORK_ERR = 'Caller must be PNETWORK address!'
  const INSUFFICIENT_BALANCE_ERR = 'ERC20: transfer amount exceeds balance'
  const INSUFFICIENT_ALLOWANCE_ERR = 'ERC20: transfer amount exceeds allowance'
  const NON_SUPPORTED_TOKEN_ERR = 'Token at supplied address is NOT supported!'
  const INSUFFICIENT_TOKEN_AMOUNT_ERR = 'Token amount must be greater than zero!'
  const ZERO_ADDRESS = `0x${new Array(40).fill(0).reduce((_acc, _e) => _acc + _e, '')}`

  beforeEach(async () => {
    assert.notStrictEqual(PNETWORK_ADDRESS, NON_PNETWORK_ADDRESS)
    WETH_CONTRACT = await getContract(web3, WETH_ARTIFACT)
    WETH_ADDRESS = WETH_CONTRACT.options.address
    const VAULT_CONTRACT = await getContract(web3, VaultArtifact, [WETH_ADDRESS, []])
    VAULT_METHODS = prop('methods', VAULT_CONTRACT)
    VAULT_ADDRESS = prop('_address', VAULT_CONTRACT)
    const ERC20_TOKEN_CONTRACT = await getContract(web3, ERC20_ARTIFACT)
    ERC20_TOKEN_METHODS = prop('methods', ERC20_TOKEN_CONTRACT)
    await ERC20_TOKEN_METHODS
      .transfer(TOKEN_HOLDER_ADDRESS, TOKEN_HOLDER_BALANCE)
      .send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    assert.strictEqual(parseInt(await ERC20_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()), TOKEN_HOLDER_BALANCE)
    ERC20_TOKEN_ADDRESS = prop('_address', ERC20_TOKEN_CONTRACT)
  })

  it('PNETWORK_ADDRESS can add appoved token address', async () => {
    let tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await VAULT_METHODS.addSupportedToken(ERC20_TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot add appoved token address', async () => {
    let tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await expectRevert(
      VAULT_METHODS.addSupportedToken(ERC20_TOKEN_ADDRESS).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
    tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
  })

  it('PNETWORK_ADDRESS can remove appoved token address', async () => {
    await VAULT_METHODS.addSupportedToken(ERC20_TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
    await VAULT_METHODS.removeSupportedToken(ERC20_TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot remove appoved token address', async () => {
    let tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await VAULT_METHODS.addSupportedToken(ERC20_TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await VAULT_METHODS.IS_TOKEN_SUPPORTED(ERC20_TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
    await expectRevert(
      VAULT_METHODS.removeSupportedToken(ERC20_TOKEN_ADDRESS).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
  })

  it('Should NOT peg in if token is not supported', async () => {
    await expectRevert(
      pegIn(VAULT_METHODS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS),
      NON_SUPPORTED_TOKEN_ERR
    )
  })

  it('Should NOT peg in if token is supported but insufficient allowance approved', async () => {
    await addTokenSupport(VAULT_METHODS, ERC20_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await expectRevert(
      pegIn(VAULT_METHODS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS),
      INSUFFICIENT_ALLOWANCE_ERR
    )
  })

  it('Should NOT peg in if token is supported and sufficient allowance approved, but token amount is 0', async () => {
    const tokenAmount = 0
    await addTokenSupport(VAULT_METHODS, ERC20_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await giveVaultAllowance(ERC20_TOKEN_METHODS, TOKEN_HOLDER_ADDRESS, VAULT_ADDRESS, TOKEN_AMOUNT)
    await expectRevert(
      pegIn(VAULT_METHODS, ERC20_TOKEN_ADDRESS, tokenAmount, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS),
      INSUFFICIENT_TOKEN_AMOUNT_ERR,
    )
  })

  it('Should peg in if token is supported and sufficient allowance approved', async () => {
    await addTokenSupport(VAULT_METHODS, ERC20_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await giveVaultAllowance(ERC20_TOKEN_METHODS, TOKEN_HOLDER_ADDRESS, VAULT_ADDRESS, TOKEN_AMOUNT)
    const tokenHolderBalanceBeforePegIn = await ERC20_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    const vaultTokenBalanceBefore = await ERC20_TOKEN_METHODS.balanceOf(VAULT_ADDRESS).call()
    const tx = await pegIn(VAULT_METHODS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    assertPegInEvent(tx.events.PegIn, ERC20_TOKEN_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
    const vaultTokenBalanceAfter = await ERC20_TOKEN_METHODS.balanceOf(VAULT_ADDRESS).call()
    const tokenHolderBalanceAfterPegIn = await ERC20_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    assert.strictEqual(parseInt(vaultTokenBalanceAfter), parseInt(vaultTokenBalanceBefore) + TOKEN_AMOUNT)
    assert.strictEqual(parseInt(tokenHolderBalanceAfterPegIn), parseInt(tokenHolderBalanceBeforePegIn) - TOKEN_AMOUNT)
  })

  it('NON_PNETWORK_ADDRESS cannot peg out', async () => {
    await addTokenSupport(VAULT_METHODS, ERC20_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await giveVaultAllowance(ERC20_TOKEN_METHODS, TOKEN_HOLDER_ADDRESS, VAULT_ADDRESS, TOKEN_AMOUNT)
    await pegIn(VAULT_METHODS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    await expectRevert(
      VAULT_METHODS
        .pegOut(TOKEN_HOLDER_ADDRESS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT)
        .send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
  })

  it('PNETWORK_ADDRESS cannot peg out if insufficient balance', async () => {
    await addTokenSupport(VAULT_METHODS, ERC20_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await expectRevert(
      VAULT_METHODS
        .pegOut(TOKEN_HOLDER_ADDRESS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT)
        .send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      INSUFFICIENT_BALANCE_ERR,
    )
  })

  it('PNETWORK_ADDRESS can peg out with sufficient balance', async () => {
    await addTokenSupport(VAULT_METHODS, ERC20_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await giveVaultAllowance(ERC20_TOKEN_METHODS, TOKEN_HOLDER_ADDRESS, VAULT_ADDRESS, TOKEN_AMOUNT)
    await pegIn(VAULT_METHODS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    const tokenHolderBalanceBeforePegOut = await ERC20_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    await VAULT_METHODS
      .pegOut(TOKEN_HOLDER_ADDRESS, ERC20_TOKEN_ADDRESS, TOKEN_AMOUNT)
      .send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    const tokenHolderBalanceAfterPegOut = await ERC20_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    assert.strictEqual(parseInt(tokenHolderBalanceAfterPegOut), parseInt(tokenHolderBalanceBeforePegOut) + TOKEN_AMOUNT)
  })

  it('Token addresses sent to constructor should be supported', async () => {
    const supportedTokenAddresses = [getRandomEthAddress(web3), getRandomEthAddress(web3)]
    const newContract = await getContract(
      web3,
      VaultArtifact,
      [WETH_ADDRESS, supportedTokenAddresses]
    )
    const tokensAreSupportedBools = await Promise.all(
      supportedTokenAddresses.map(_address => newContract.methods.IS_TOKEN_SUPPORTED(_address))
    )
    tokensAreSupportedBools.map(_tokenIsSupported => assert(_tokenIsSupported))
  })

  it('Automatically pegIn on ERC777 send', async () => {
    const eventABI = find(
      x => x.name === 'PegIn' && x.type === 'event',
      VaultArtifact.abi
    )
    const eventSignature = web3.eth.abi.encodeEventSignature(eventABI)
    const erc777 = await getContract(web3, ERC777_ARTIFACT, [{ from: TOKEN_HOLDER_ADDRESS }])
    await VAULT_METHODS.addSupportedToken(erc777.options.address).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })

    const tag = web3.utils.keccak256('ERC777-pegIn')
    const userData = web3.eth.abi.encodeParameters(['bytes32', 'string'], [tag, DESTINATION_ADDRESS])
    const res = await erc777.methods.send(VAULT_ADDRESS, TOKEN_AMOUNT, userData)
      .send({ from: TOKEN_HOLDER_ADDRESS })

    const event = find(e => e.raw.topics[0] === eventSignature, values(res.events))
    assert(event != null, 'PegIn event not found')
    const decoded = web3.eth.abi.decodeLog(eventABI.inputs, event.raw.data, event.raw.topics)
    assert.strictEqual(decoded._tokenAddress, erc777.options.address, '_tokenAddress')
    assert.strictEqual(decoded._tokenSender, TOKEN_HOLDER_ADDRESS, '_tokenSender')
    assert.strictEqual(decoded._tokenAmount, TOKEN_AMOUNT.toString(), '_tokenAmount')
    assert.strictEqual(decoded._destinationAddress, DESTINATION_ADDRESS, '_destinationAddress')
  })

  it('Should pegIn an ERC777', async () => {
    const erc777 = await getContract(web3, ERC777_ARTIFACT, [{ from: TOKEN_HOLDER_ADDRESS }])
    await VAULT_METHODS.addSupportedToken(erc777.options.address).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })

    await erc777.methods.approve(VAULT_ADDRESS, TOKEN_AMOUNT).send({ from: TOKEN_HOLDER_ADDRESS })
    const tx = await pegIn(
      VAULT_METHODS,
      erc777.options.address,
      TOKEN_AMOUNT,
      TOKEN_HOLDER_ADDRESS,
      DESTINATION_ADDRESS
    )
    assertPegInEvent(tx.events.PegIn, erc777.options.address, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
  })

  it('Should peg in wETH', async () => {
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    const tx = await VAULT_METHODS
      .pegInEth(DESTINATION_ADDRESS)
      .send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    assertPegInEvent(tx.events.PegIn, WETH_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), TOKEN_AMOUNT.toString())
    assert.strictEqual(await web3.eth.getBalance(VAULT_ADDRESS), '0', 'eth balance must be 0')
  })

  it('Should peg out wETH without user data', async () => {
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    await VAULT_METHODS.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    const ethBalanceBefore = await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS)
    await VAULT_METHODS
      .pegOut(TOKEN_HOLDER_ADDRESS, WETH_ADDRESS, TOKEN_AMOUNT)
      .send({ from: PNETWORK_ADDRESS })
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), '0')
    assert.strictEqual(await web3.eth.getBalance(VAULT_ADDRESS), '0', 'eth balance must be 0')
    const expectedEthBalance = web3.utils.toBN(ethBalanceBefore).add(web3.utils.toBN(TOKEN_AMOUNT)).toString()
    assert.strictEqual(await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS), expectedEthBalance)
  })

  it('Should peg out wETH with user data', async () => {
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    await VAULT_METHODS.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    const ethBalanceBefore = await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS)
    await VAULT_METHODS['pegOut(address,address,uint256,bytes)'](
      TOKEN_HOLDER_ADDRESS,
      WETH_ADDRESS,
      TOKEN_AMOUNT,
      USER_DATA,
    ).send({ from: PNETWORK_ADDRESS })
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), '0')
    assert.strictEqual(await web3.eth.getBalance(VAULT_ADDRESS), '0', 'Vault\'s ETH balance must be 0!')
    const expectedEthBalance = web3.utils.toBN(ethBalanceBefore).add(web3.utils.toBN(TOKEN_AMOUNT)).toString()
    assert.strictEqual(await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS), expectedEthBalance)
  })

  it('Should peg in with user data', async () => {
    await addTokenSupport(VAULT_METHODS, ERC20_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await giveVaultAllowance(ERC20_TOKEN_METHODS, TOKEN_HOLDER_ADDRESS, VAULT_ADDRESS, TOKEN_AMOUNT)
    const tokenHolderBalanceBeforePegIn = await ERC20_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    const vaultTokenBalanceBefore = await ERC20_TOKEN_METHODS.balanceOf(VAULT_ADDRESS).call()
    const tx = await pegInWithUserData(
      VAULT_METHODS,
      ERC20_TOKEN_ADDRESS,
      TOKEN_AMOUNT,
      TOKEN_HOLDER_ADDRESS,
      DESTINATION_ADDRESS,
      USER_DATA,
    )
    assertPegInEvent(
      tx.events.PegIn,
      ERC20_TOKEN_ADDRESS,
      TOKEN_HOLDER_ADDRESS,
      TOKEN_AMOUNT,
      DESTINATION_ADDRESS,
      USER_DATA
    )
    const vaultTokenBalanceAfter = await ERC20_TOKEN_METHODS.balanceOf(VAULT_ADDRESS).call()
    const tokenHolderBalanceAfterPegIn = await ERC20_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    assert.strictEqual(parseInt(vaultTokenBalanceAfter), parseInt(vaultTokenBalanceBefore) + TOKEN_AMOUNT)
    assert.strictEqual(parseInt(tokenHolderBalanceAfterPegIn), parseInt(tokenHolderBalanceBeforePegIn) - TOKEN_AMOUNT)
  })

  it('Should peg in WETH_CONTRACT with user data', async () => {
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    const tx = await VAULT_METHODS['pegInEth(string,bytes)'](DESTINATION_ADDRESS, USER_DATA)
      .send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    assertPegInEvent(
      tx.events.PegIn,
      WETH_ADDRESS,
      TOKEN_HOLDER_ADDRESS,
      TOKEN_AMOUNT,
      DESTINATION_ADDRESS,
      USER_DATA
    )
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), TOKEN_AMOUNT.toString())
    assert.strictEqual(await web3.eth.getBalance(VAULT_ADDRESS), '0', 'eth balance must be 0')
  })

  it('Can peg out with user data', async () => {
    const userData = '0xdecaff'
    const ERC777_TOKEN_CONTRACT = await getContract(web3, ERC777_ARTIFACT, [{ from: TOKEN_HOLDER_ADDRESS }])
    const ERC777_TOKEN_ADDRESS = ERC777_TOKEN_CONTRACT.options.address
    const ERC777_TOKEN_METHODS = prop('methods', ERC777_TOKEN_CONTRACT)
    await VAULT_METHODS.addSupportedToken(ERC777_TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    await giveVaultAllowance(ERC777_TOKEN_METHODS, TOKEN_HOLDER_ADDRESS, VAULT_ADDRESS, TOKEN_AMOUNT)
    await addTokenSupport(VAULT_METHODS, ERC777_TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await pegIn(VAULT_METHODS, ERC777_TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    const tokenHolderBalanceBeforePegOut = await ERC777_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    await VAULT_METHODS['pegOut(address,address,uint256,bytes)'](
      TOKEN_HOLDER_ADDRESS,
      ERC777_TOKEN_ADDRESS,
      TOKEN_AMOUNT,
      userData,
    ).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    const tokenHolderBalanceAfterPegOut = await ERC777_TOKEN_METHODS.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    assert.strictEqual(parseInt(tokenHolderBalanceAfterPegOut), parseInt(tokenHolderBalanceBeforePegOut) + TOKEN_AMOUNT)
    const TOKENS_RECEIVED_EVENT_TOPIC = '0x06b541ddaa720db2b10a4d0cdac39b8d360425fc073085fac19bc82614677987'
    const tokensReceivedLogs = await web3.eth.getPastLogs({
      address: ERC777_TOKEN_ADDRESS,
      topics: [ TOKENS_RECEIVED_EVENT_TOPIC ]
    })
    assert.strictEqual(tokensReceivedLogs.length, 1)
    const [ tokensReceivedLog ] = tokensReceivedLogs
    const ethWordSizeInHexChars = 64
    const startIndexOfUserData = ethWordSizeInHexChars * 4
    const userDataFromLog = `0x${maybeStripHexPrefix(tokensReceivedLog.data)
      .slice(startIndexOfUserData, startIndexOfUserData + maybeStripHexPrefix(userData).length)}`
    assert.strictEqual(userData, userDataFromLog)
  })

  it('Should peg out wETH to smart-contract w/ expensive fallback function', async () => {
    const PEG_OUT_GAS_LIMIT = 450e3
    const expensiveFallbackContract = await getContract(web3, CONTRACT_WITH_EXPENSIVE_FALLBACK_FXN_ARTIFACT)
    const expensiveFallbackContractAddress = expensiveFallbackContract._address
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    const expensiveContractEthBalanceBeforePegout = await web3.eth.getBalance(expensiveFallbackContractAddress)
    assert.strictEqual(expensiveContractEthBalanceBeforePegout, '0')
    await VAULT_METHODS.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    await VAULT_METHODS
      .pegOut(expensiveFallbackContractAddress, WETH_ADDRESS, TOKEN_AMOUNT)
      .send({ from: PNETWORK_ADDRESS, gas: PEG_OUT_GAS_LIMIT })
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), '0')
    const expensiveContractEthBalanceAfterPegout = await web3.eth.getBalance(expensiveFallbackContractAddress)
    assert.strictEqual(expensiveContractEthBalanceAfterPegout, `${TOKEN_AMOUNT}`)
    const vaultEthBalanceAfterPegOut = await web3.eth.getBalance(VAULT_ADDRESS)
    assert.strictEqual(vaultEthBalanceAfterPegOut, '0', 'Vault\'s ETH balance after peg out must be 0!')
  })

  it('Should be able to peg out wETH with user data to a smart-contract', async () => {
    const userData = '0xdecaff'
    const PEG_OUT_GAS_LIMIT = 450e3
    const expensiveFallbackContract = await getContract(web3, CONTRACT_WITH_EXPENSIVE_FALLBACK_FXN_ARTIFACT)
    const expensiveFallbackContractAddress = expensiveFallbackContract._address
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    const expensiveContractEthBalanceBeforePegout = await web3.eth.getBalance(expensiveFallbackContractAddress)
    assert.strictEqual(expensiveContractEthBalanceBeforePegout, '0')
    await VAULT_METHODS.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    await VAULT_METHODS['pegOut(address,address,uint256,bytes)'](
      expensiveFallbackContractAddress,
      WETH_ADDRESS,
      TOKEN_AMOUNT,
      userData,
    )
      .send({ from: PNETWORK_ADDRESS, gas: PEG_OUT_GAS_LIMIT })
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), '0')
    const expensiveContractEthBalanceAfterPegout = await web3.eth.getBalance(expensiveFallbackContractAddress)
    assert.strictEqual(expensiveContractEthBalanceAfterPegout, `${TOKEN_AMOUNT}`)
    const vaultEthBalanceAfterPegOut = await web3.eth.getBalance(VAULT_ADDRESS)
    assert.strictEqual(vaultEthBalanceAfterPegOut, '0', 'Vault\'s ETH balance after peg out must be 0!')
    const fallbackContractEvents = await expensiveFallbackContract.getPastEvents('allEvents')
    assert.strictEqual(fallbackContractEvents.length, 1)
    const fallbackEventData = fallbackContractEvents[0].raw.data
    const WORD_SIZE_IN_HEX_CHARS = 64
    const HEX_PREFIX_LENGTH = 2
    const amountFromEvent = parseInt(
      `0x${fallbackEventData.slice(HEX_PREFIX_LENGTH, WORD_SIZE_IN_HEX_CHARS + HEX_PREFIX_LENGTH)}`,
    )
    assert.strictEqual(amountFromEvent, TOKEN_AMOUNT)
    const dataFromEevent = fallbackEventData
      .slice(-WORD_SIZE_IN_HEX_CHARS).slice(0, userData.length - HEX_PREFIX_LENGTH)
    assert.strictEqual(`0x${dataFromEevent}`, userData)
  })

  it('Should not fail to peg out wETH with user data to an EOA', async () => {
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    const userData = '0xdecaff'
    await VAULT_METHODS.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    const ethBalanceBefore = await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS)
    await VAULT_METHODS
      .pegOut(TOKEN_HOLDER_ADDRESS, WETH_ADDRESS, TOKEN_AMOUNT, userData)
      .send({ from: PNETWORK_ADDRESS })
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), '0')
    assert.strictEqual(await web3.eth.getBalance(VAULT_ADDRESS), '0', 'eth balance must be 0')
    const expectedEthBalance = web3.utils.toBN(ethBalanceBefore).add(web3.utils.toBN(TOKEN_AMOUNT)).toString()
    assert.strictEqual(await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS), expectedEthBalance)
  })

  it('PNETWORK_ADDRESS can change PNETWORK_ADDRESS', async () => {
    const newPNetworkAddress = getRandomEthAddress(web3)
    const pNetworkBefore = await VAULT_METHODS.PNETWORK().call()
    assert.strictEqual(pNetworkBefore, PNETWORK_ADDRESS)
    await VAULT_METHODS.setPNetwork(newPNetworkAddress).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    const pNetworkAfter = await VAULT_METHODS.PNETWORK().call()
    assert.strictEqual(pNetworkAfter.toLowerCase(), newPNetworkAddress)
  })

  it('NON_PNETWORK_ADDRESS cannot change PNETWORK_ADDRESS', async () => {
    const newPNetworkAddress = getRandomEthAddress(web3)
    const pNetworkBefore = await VAULT_METHODS.PNETWORK().call()
    assert.strictEqual(pNetworkBefore, PNETWORK_ADDRESS)
    await expectRevert(
      VAULT_METHODS.setPNetwork(newPNetworkAddress).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      'Caller must be PNETWORK address!',
    )
    const pNetworkAfter = await VAULT_METHODS.PNETWORK().call()
    assert.strictEqual(pNetworkAfter, pNetworkBefore)
  })

  it('Should not be able to set pNetwork address to the zero address', async () => {
    const pNetworkBefore = await VAULT_METHODS.PNETWORK().call()
    assert.strictEqual(pNetworkBefore, PNETWORK_ADDRESS)
    await expectRevert(
      VAULT_METHODS.setPNetwork(ZERO_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      'Cannot set the zero address as the pNetwork address!',
    )
    const pNetworkAfter = await VAULT_METHODS.PNETWORK().call()
    assert.strictEqual(pNetworkAfter, pNetworkBefore)
  })

  it('Pegging out wETH Should not be susceptible to re-entrancy attack', async () => {
    const calldata = web3.eth.abi.encodeFunctionCall({
      name: 'attempReEntrancyAttack',
      type: 'function',
      inputs: [],
    }, [])
    const PEG_OUT_GAS_LIMIT = 450e3
    const reEntrancyAttackContract = await getContract(web3, CONTRACT_WITH_RE_ENTRANCY_ATTACK_ARTIFACT)
    const reEntrancyAttackContractAddress = reEntrancyAttackContract._address
    await addTokenSupport(VAULT_METHODS, WETH_ADDRESS, PNETWORK_ADDRESS)
    const reEntrancyAttackContractEthBalanceBeforePegout = await web3.eth.getBalance(reEntrancyAttackContractAddress)
    assert.strictEqual(reEntrancyAttackContractEthBalanceBeforePegout, '0')
    await VAULT_METHODS.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    const expectedError = 'ETH transfer failed when pegging out wETH!'
    expectRevert(VAULT_METHODS['pegOut(address,address,uint256,bytes)'](
      reEntrancyAttackContractAddress, WETH_ADDRESS, TOKEN_AMOUNT, calldata
    )
      .send({ from: PNETWORK_ADDRESS, gas: PEG_OUT_GAS_LIMIT }),
    expectedError
    )
    assert.strictEqual(await WETH_CONTRACT.methods.balanceOf(VAULT_ADDRESS).call(), `${TOKEN_AMOUNT}`)
    const reEntrancyAttackContractEthBalanceAfterPegout = await web3.eth.getBalance(reEntrancyAttackContractAddress)
    assert.strictEqual(reEntrancyAttackContractEthBalanceAfterPegout, '0')
    const vaultEthBalanceAfterPegOut = await web3.eth.getBalance(VAULT_ADDRESS)
    assert.strictEqual(vaultEthBalanceAfterPegOut, '0', 'Vault\'s ETH balance after peg out must be 0!')
  })
})
