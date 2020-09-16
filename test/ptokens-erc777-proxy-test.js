/* eslint-disable no-undef */
const assert = require('assert')
const { prop } = require('ramda')
const TOKEN_ARTIFACT = artifacts.require('ERC20_TOKEN')
const PErc20OnEosArtifact = artifacts.require('PErc20OnEos')
const { expectRevert } = require('@openzeppelin/test-helpers')

const getContract = (_web3, _artifact, _constructorParams = []) =>
  new Promise((resolve, reject) =>
    _artifact
      .new(..._constructorParams)
      .then(({ contract: { _jsonInterface, _address } }) => resolve(new _web3.eth.Contract(_jsonInterface, _address)))
      .catch(reject)
  )

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
  const INSUFFICIENT_BALANCE_ERR = 'ERC20: transfer amount exceeds balance'
  const INSUFFICIENT_ALLOWANCE_ERR = 'ERC20: transfer amount exceeds allowance'
  const NON_SUPPORTED_TOKEN_ERR = 'Token at supplied address is NOT supported!'

  beforeEach(async () => {
    assert.notStrictEqual(PNETWORK_ADDRESS, NON_PNETWORK_ADDRESS)
    const pERC20Contract = await getContract(web3, PErc20OnEosArtifact)
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
    let tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot add appoved token address', async () => {
    let tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await expectRevert(
      pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
    tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
  })

  it('PNETWORK_ADDRESS can remove appoved token address', async () => {
    await pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
    assert(tokenIsSupported)
    await pErc20Methods.removeSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot remove appoved token address', async () => {
    let tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
    assert(!tokenIsSupported)
    await pErc20Methods.addSupportedToken(TOKEN_ADDRESS).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pErc20Methods.SUPPORTED_TOKENS(TOKEN_ADDRESS).call()
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
})
