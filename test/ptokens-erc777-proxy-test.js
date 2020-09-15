/* eslint-disable no-undef */
const assert = require('assert')
const { prop } = require('ramda')
const PERC20_ARTIFACT = artifacts.require('PERC20')
const TOKEN_ARTIFACT = artifacts.require('ERC20_TOKEN')
const { expectRevert } = require('@openzeppelin/test-helpers')

const getContract = (_web3, _artifact, _constructorParams = []) =>
  new Promise((resolve, reject) =>
    _artifact
      .new(..._constructorParams)
      .then(({ contract: { _jsonInterface, _address } }) => resolve(new _web3.eth.Contract(_jsonInterface, _address)))
      .catch(reject)
  )

contract('PERC20', ([PNETWORK_ADDRESS, NON_PNETWORK_ADDRESS, ...ACCOUNTS]) => {
  const GAS_LIMIT = 3e6
  const NON_PNETWORK_ERR = 'Caller must be PNETWORK address!'

  beforeEach(async () => {
    assert.notStrictEqual(PNETWORK_ADDRESS, NON_PNETWORK_ADDRESS)
    const pERC20Contract = await getContract(web3, PERC20_ARTIFACT)
    pERC20Methods = prop('methods', pERC20Contract)
    pERC20Address = prop('_address', pERC20Contract)
    const tokenContract = await getContract(web3, TOKEN_ARTIFACT)
    tokenMethods = prop('methods', tokenContract)
    tokenAddress = prop('_address', tokenContract)
  })

  it('PNETWORK_ADDRESS can add appoved token address', async () => {
    let tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(!tokenIsSupported)
    await pERC20Methods.addSupportedToken(tokenAddress).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot add appoved token address', async () => {
    let tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(!tokenIsSupported)
    await expectRevert(
      pERC20Methods.addSupportedToken(tokenAddress).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
    tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(!tokenIsSupported)
  })

  it('PNETWORK_ADDRESS can remove appoved token address', async () => {
    await pERC20Methods.addSupportedToken(tokenAddress).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(tokenIsSupported)
    await pERC20Methods.removeSupportedToken(tokenAddress).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(!tokenIsSupported)
  })

  it('NON_PNETWORK_ADDRESS cannot remove appoved token address', async () => {
    let tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(!tokenIsSupported)
    await pERC20Methods.addSupportedToken(tokenAddress).send({ from: PNETWORK_ADDRESS, gas: GAS_LIMIT })
    tokenIsSupported = await pERC20Methods.SUPPORTED_TOKENS(tokenAddress).call()
    assert(tokenIsSupported)
    await expectRevert(
      pERC20Methods.removeSupportedToken(tokenAddress).send({ from: NON_PNETWORK_ADDRESS, gas: GAS_LIMIT }),
      NON_PNETWORK_ERR,
    )
  })
})
