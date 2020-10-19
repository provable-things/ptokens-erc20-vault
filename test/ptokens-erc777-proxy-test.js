/* eslint-disable no-undef */
const assert = require('assert')
const { prop, find, values } = require('ramda')
const TOKEN_ARTIFACT = artifacts.require('ERC20_TOKEN')
const ERC777_ARTIFACT = artifacts.require('ERC777_TOKEN')
const WETH_ARTIFACT = artifacts.require('WETH')
const PERC20OnEosVaultArtifact = artifacts.require('PERC20OnEosVault')
const { expectRevert } = require('@openzeppelin/test-helpers')

const getContract = (_web3, _artifact, _constructorParams = []) =>
  new Promise((resolve, reject) =>
    _artifact
      .new(..._constructorParams)
      .then(({ contract: { _jsonInterface, _address } }) => resolve(new _web3.eth.Contract(_jsonInterface, _address)))
      .catch(reject)
  )

const getRandomEthAddress = _web3 =>
  _web3.utils.randomHex(20)

const addTokenSupport = (_pErc20Methods, _tokenAddress, _from, _gasLimit = 3e6) =>
  _pErc20Methods.addSupportedToken(_tokenAddress).send({ from: _from, gas: _gasLimit })

const givePErc20Allowance = (_tokenMethods, _holderAddress, _spenderAddress, _tokenAmount, _gasLimit = 3e6) =>
  _tokenMethods.approve(_spenderAddress, _tokenAmount).send({ from: _holderAddress, gas: _gasLimit })

const assertPegInEvent = (_pegInEvent, _tokenAddress, _tokenSender, _tokenAmount, _destinationAddress) => {
  assert.strictEqual(_pegInEvent.returnValues._tokenAddress, _tokenAddress)
  assert.strictEqual(_pegInEvent.returnValues._tokenSender, _tokenSender)
  assert.strictEqual(_pegInEvent.returnValues._tokenAmount, `${_tokenAmount}`)
  assert.strictEqual(_pegInEvent.returnValues._destinationAddress, _destinationAddress)
}

const pegIn = (_pErc20Methods, _tokenAddress, _tokenAmount, _tokenHolder, _destinationAddress, _gasLimit = 3e6) =>
  _pErc20Methods
    .pegIn(_tokenAmount, _tokenAddress, _destinationAddress)
    .send({ from: _tokenHolder, gas: _gasLimit })

contract('PERC20', ([PNETWORK_ADDRESS, NON_PNETWORK_ADDRESS, TOKEN_HOLDER_ADDRESS, ...ACCOUNTS]) => {
  const GAS_LIMIT = 3e6
  const TOKEN_AMOUNT = 1337
  const TOKEN_HOLDER_BALANCE = 1e6
  const DESTINATION_ADDRESS = 'EOS_ADDRESS'
  const NON_PNETWORK_ERR = 'Caller must be PNETWORK address!'
  const MIGRATION_DESTINATION_ADDRESS = getRandomEthAddress(web3)
  const INSUFFICIENT_BALANCE_ERR = 'ERC20: transfer amount exceeds balance'
  const INSUFFICIENT_ALLOWANCE_ERR = 'ERC20: transfer amount exceeds allowance'
  const NON_SUPPORTED_TOKEN_ERR = 'Token at supplied address is NOT supported!'
  const INSUFFICIENT_TOKEN_AMOUNT_ERR = 'Token amount must be greater than zero!'

  let weth

  beforeEach(async () => {
    assert.notStrictEqual(PNETWORK_ADDRESS, NON_PNETWORK_ADDRESS)
    weth = await getContract(web3, WETH_ARTIFACT)
    const pERC20Contract = await getContract(web3, PERC20OnEosVaultArtifact, [weth.options.address, []])
    pErc20Methods = prop('methods', pERC20Contract)
    PERC20_ADDRESS = prop('_address', pERC20Contract)
    const tokenContract = await getContract(web3, TOKEN_ARTIFACT)
    tokenMethods = prop('methods', tokenContract)
    await tokenMethods
      .transfer(TOKEN_HOLDER_ADDRESS, TOKEN_HOLDER_BALANCE)
      .send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    assert.strictEqual(parseInt(await tokenMethods.balanceOf(TOKEN_HOLDER_ADDRESS).call()), TOKEN_HOLDER_BALANCE)
    TOKEN_ADDRESS = prop('_address', tokenContract)
  })

  it('PNETWORK_ADDRESS can add appoved token address', async () => {
    let tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot add appoved token address', async () => {
    let tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await expectRevert(
      pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
    tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
  })

  it('PNETWORK_ADDRESS can remove appoved token address', async () => {
    await pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
    await pErc20Methods.removeSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot remove appoved token address', async () => {
    let tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.IS_TOKEN_SUPPORTED(TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
    await expectRevert(
      pErc20Methods.removeSupportedToken(TOKEN_ADDRESS).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
  })

  it('Should NOT peg in if token is not supported', async () => {
    await expectRevert(
      pegIn(pErc20Methods, TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS),
      NON_SUPPORTED_TOKEN_ERR
    )
  })

  it('Should NOT peg in if token is supported but insufficient allowance approved', async () => {
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await expectRevert(
      pegIn(pErc20Methods, TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS),
      INSUFFICIENT_ALLOWANCE_ERR
    )
  })

  it('Should NOT peg in if token is supported and sufficient allowance approved, but token amount is 0', async () => {
    const tokenAmount = 0
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await givePErc20Allowance(tokenMethods, TOKEN_HOLDER_ADDRESS, PERC20_ADDRESS, TOKEN_AMOUNT)
    await expectRevert(
      pegIn(pErc20Methods, TOKEN_ADDRESS, tokenAmount, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS),
      INSUFFICIENT_TOKEN_AMOUNT_ERR,
    )
  })

  it('Should peg in if token is supported and sufficient allowance approved', async () => {
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await givePErc20Allowance(tokenMethods, TOKEN_HOLDER_ADDRESS, PERC20_ADDRESS, TOKEN_AMOUNT)
    const tokenHolderBalanceBeforePegIn = await tokenMethods.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    const pErc20TokenBalanceBeforePegIn = await tokenMethods.balanceOf(PERC20_ADDRESS).call()
    const tx = await pegIn(pErc20Methods, TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    assertPegInEvent(tx.events.PegIn, TOKEN_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
    const pErc20TokenBalanceAfterPegIn = await tokenMethods.balanceOf(PERC20_ADDRESS).call()
    const tokenHolderBalanceAfterPegIn = await tokenMethods.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    assert.strictEqual(parseInt(pErc20TokenBalanceAfterPegIn), parseInt(pErc20TokenBalanceBeforePegIn) + TOKEN_AMOUNT)
    assert.strictEqual(parseInt(tokenHolderBalanceAfterPegIn), parseInt(tokenHolderBalanceBeforePegIn) - TOKEN_AMOUNT)
  })

  it('NON_PNETWORK_ADDRESS cannot peg out', async () => {
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await givePErc20Allowance(tokenMethods, TOKEN_HOLDER_ADDRESS, PERC20_ADDRESS, TOKEN_AMOUNT)
    await pegIn(pErc20Methods, TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    await expectRevert(
      pErc20Methods
        .pegOut(TOKEN_HOLDER_ADDRESS, TOKEN_ADDRESS, TOKEN_AMOUNT)
        .send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
  })

  it('PNETWORK_ADDRESS cannot peg out if insufficient balance', async () => {
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await expectRevert(
      pErc20Methods
        .pegOut(TOKEN_HOLDER_ADDRESS, TOKEN_ADDRESS, TOKEN_AMOUNT)
        .send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      INSUFFICIENT_BALANCE_ERR,
    )
  })

  it('PNETWORK_ADDRESS can peg out with sufficient balance', async () => {
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await givePErc20Allowance(tokenMethods, TOKEN_HOLDER_ADDRESS, PERC20_ADDRESS, TOKEN_AMOUNT)
    await pegIn(pErc20Methods, TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    const tokenHolderBalanceBeforePegOut = await tokenMethods.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    await pErc20Methods
      .pegOut(TOKEN_HOLDER_ADDRESS, TOKEN_ADDRESS, TOKEN_AMOUNT)
      .send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    const tokenHolderBalanceAfterPegOut = await tokenMethods.balanceOf(TOKEN_HOLDER_ADDRESS).call()
    assert.strictEqual(parseInt(tokenHolderBalanceAfterPegOut), parseInt(tokenHolderBalanceBeforePegOut) + TOKEN_AMOUNT)
  })

  it('PNETWORK_ADDRESS can migrate', async () => {
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await givePErc20Allowance(tokenMethods, TOKEN_HOLDER_ADDRESS, PERC20_ADDRESS, TOKEN_AMOUNT)
    const migratedAddressTokenBalanceBefore = await tokenMethods.balanceOf(MIGRATION_DESTINATION_ADDRESS).call()
    const pErc20TokenBalanceBeforePegIn = await tokenMethods.balanceOf(PERC20_ADDRESS).call()
    const tx = await pegIn(pErc20Methods, TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    assertPegInEvent(tx.events.PegIn, TOKEN_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
    const pErc20TokenBalanceAfterPegIn = await tokenMethods.balanceOf(PERC20_ADDRESS).call()
    assert.strictEqual(parseInt(pErc20TokenBalanceAfterPegIn), parseInt(pErc20TokenBalanceBeforePegIn) + TOKEN_AMOUNT)
    assert.strictEqual(parseInt(migratedAddressTokenBalanceBefore), 0)
    await pErc20Methods.migrate(MIGRATION_DESTINATION_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    const migratedAddressTokenBalanceAfter = await tokenMethods.balanceOf(MIGRATION_DESTINATION_ADDRESS).call()
    assert.strictEqual(parseInt(migratedAddressTokenBalanceAfter), TOKEN_AMOUNT)
  })

  it('Non PNETWORK_ADDRESS cannot migrate', async () => {
    await expectRevert(
      pErc20Methods.migrate(MIGRATION_DESTINATION_ADDRESS).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
  })

  it('Token addresses sent to constructor should be supported', async () => {
    const supportedTokenAddresses = [getRandomEthAddress(web3), getRandomEthAddress(web3)]
    const newContract = await getContract(web3, PERC20OnEosVaultArtifact, [weth.options.address, supportedTokenAddresses])
    const tokensAreSupportedBools = await Promise.all(
      supportedTokenAddresses.map(_address => newContract.methods.IS_TOKEN_SUPPORTED(_address))
    )
    tokensAreSupportedBools.map(_tokenIsSupported => assert(_tokenIsSupported))
  })

  it('PNETWORK_ADDRESS can migrate single', async () => {
    await addTokenSupport(pErc20Methods, TOKEN_ADDRESS, PNETWORK_ADDRESS)
    await givePErc20Allowance(tokenMethods, TOKEN_HOLDER_ADDRESS, PERC20_ADDRESS, TOKEN_AMOUNT)
    const migratedAddressTokenBalanceBefore = await tokenMethods.balanceOf(MIGRATION_DESTINATION_ADDRESS).call()
    const pErc20TokenBalanceBeforePegIn = await tokenMethods.balanceOf(PERC20_ADDRESS).call()
    const tx = await pegIn(pErc20Methods, TOKEN_ADDRESS, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    assertPegInEvent(tx.events.PegIn, TOKEN_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
    const pErc20TokenBalanceAfterPegIn = await tokenMethods.balanceOf(PERC20_ADDRESS).call()
    assert.strictEqual(parseInt(pErc20TokenBalanceAfterPegIn), parseInt(pErc20TokenBalanceBeforePegIn) + TOKEN_AMOUNT)
    assert.strictEqual(parseInt(migratedAddressTokenBalanceBefore), 0)
    await pErc20Methods.migrateSingle(MIGRATION_DESTINATION_ADDRESS, TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    const migratedAddressTokenBalanceAfter = await tokenMethods.balanceOf(MIGRATION_DESTINATION_ADDRESS).call()
    assert.strictEqual(parseInt(migratedAddressTokenBalanceAfter), TOKEN_AMOUNT)
  })

  it('Non PNETWORK_ADDRESS cannot migrateSingle', async () => {
    await expectRevert(
      pErc20Methods
        .migrateSingle(MIGRATION_DESTINATION_ADDRESS, TOKEN_ADDRESS)
        .send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
  })

  it('Automatically pegIn on ERC777 send', async () => {
    const eventABI = find(
      x => x.name === 'PegIn' && x.type === 'event',
      PERC20OnEosVaultArtifact.abi
    )
    const eventSignature = web3.eth.abi.encodeEventSignature(eventABI)
    const erc777 = await getContract(web3, ERC777_ARTIFACT, [{ from: TOKEN_HOLDER_ADDRESS }])
    await pErc20Methods.addSupportedToken(erc777.options.address).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })

    const tag = web3.utils.keccak256('ERC777-pegIn')
    const userData = web3.eth.abi.encodeParameters(['bytes32', 'string'], [tag, DESTINATION_ADDRESS])
    const res = await erc777.methods.send(PERC20_ADDRESS, TOKEN_AMOUNT, userData)
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
    await pErc20Methods.addSupportedToken(erc777.options.address).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })

    await erc777.methods.approve(PERC20_ADDRESS, TOKEN_AMOUNT).send({ from: TOKEN_HOLDER_ADDRESS })
    const tx = await pegIn(pErc20Methods, erc777.options.address, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    assertPegInEvent(tx.events.PegIn, erc777.options.address, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
  })

  it('PNETWORK_ADDRESS can migrate with ERC777', async () => {
    const erc777 = await getContract(web3, ERC777_ARTIFACT, [{ from: TOKEN_HOLDER_ADDRESS }])
    await addTokenSupport(pErc20Methods, erc777.options.address, PNETWORK_ADDRESS)
    await givePErc20Allowance(erc777.methods, TOKEN_HOLDER_ADDRESS, PERC20_ADDRESS, TOKEN_AMOUNT)
    const migratedAddressTokenBalanceBefore = await erc777.methods.balanceOf(MIGRATION_DESTINATION_ADDRESS).call()
    const pErc20TokenBalanceBeforePegIn = await erc777.methods.balanceOf(PERC20_ADDRESS).call()
    const tx = await pegIn(pErc20Methods, erc777.options.address, TOKEN_AMOUNT, TOKEN_HOLDER_ADDRESS, DESTINATION_ADDRESS)
    assertPegInEvent(tx.events.PegIn, erc777.options.address, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
    const pErc20TokenBalanceAfterPegIn = await erc777.methods.balanceOf(PERC20_ADDRESS).call()
    assert.strictEqual(parseInt(pErc20TokenBalanceAfterPegIn), parseInt(pErc20TokenBalanceBeforePegIn) + TOKEN_AMOUNT)
    assert.strictEqual(parseInt(migratedAddressTokenBalanceBefore), 0)
    await pErc20Methods.migrate(MIGRATION_DESTINATION_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    const migratedAddressTokenBalanceAfter = await erc777.methods.balanceOf(MIGRATION_DESTINATION_ADDRESS).call()
    assert.strictEqual(parseInt(migratedAddressTokenBalanceAfter), TOKEN_AMOUNT)
  })

  it('Should peg in weth', async () => {
    await addTokenSupport(pErc20Methods, weth.options.address, PNETWORK_ADDRESS)

    const tx = await pErc20Methods.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })

    assertPegInEvent(tx.events.PegIn, weth.options.address, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT, DESTINATION_ADDRESS)
    assert.strictEqual(await weth.methods.balanceOf(PERC20_ADDRESS).call(), TOKEN_AMOUNT.toString())
    assert.strictEqual(await web3.eth.getBalance(PERC20_ADDRESS), '0', 'eth balance must be 0')
  })

  it('Should peg out weth', async () => {
    await addTokenSupport(pErc20Methods, weth.options.address, PNETWORK_ADDRESS)
    await pErc20Methods.pegInEth(DESTINATION_ADDRESS).send({ from: TOKEN_HOLDER_ADDRESS, value: TOKEN_AMOUNT })
    const ethBalanceBefore = await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS)

    await pErc20Methods.pegOut(TOKEN_HOLDER_ADDRESS, weth.options.address, TOKEN_AMOUNT).send({ from: PNETWORK_ADDRESS })

    assert.strictEqual(await weth.methods.balanceOf(PERC20_ADDRESS).call(), '0')
    assert.strictEqual(await web3.eth.getBalance(PERC20_ADDRESS), '0', 'eth balance must be 0')
    const expectedEthBalance = web3.utils.toBN(ethBalanceBefore).add(web3.utils.toBN(TOKEN_AMOUNT)).toString()
    assert.strictEqual(await web3.eth.getBalance(TOKEN_HOLDER_ADDRESS), expectedEthBalance)
  })
})
