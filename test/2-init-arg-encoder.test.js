const {
  ORIGIN_CHAIN_ID,
  DESTINATION_CHAIN_ID,
} = require('./test-constants')
const assert = require('assert')
const rewire = require('rewire')
const { silenceConsoleInfoOutput } = require('./test-utils')
const rewiredModule = rewire('../lib/get-encoded-init-args')
const encodeInitArgs = rewiredModule.__get__('encodeInitArgs')

describe('Testing Constructor Arg Encoder...', () => {
  silenceConsoleInfoOutput()

  it('Should encode init args correctly', async () => {
    const wEthAddress = '0x7F101fE45e6649A6fB8F3F8B43ed03D353f2B90c'
    const tokensToSupport = [
      '0x9A6eB104F0D3459056Ff502e3D34f82Beb69bBD4',
      '0xea674fdde714fd979de3edf0f56aa9716b898ec8',
    ]
    const result = await encodeInitArgs(
      wEthAddress,
      tokensToSupport,
      ORIGIN_CHAIN_ID,
      [ DESTINATION_CHAIN_ID ],
    )
    /* eslint-disable-next-line max-len */
    const expectedResult = '0xf29d4d0f0000000000000000000000007f101fe45e6649a6fb8f3f8b43ed03d353f2b90c00000000000000000000000000000000000000000000000000000000000000800069c3220000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000020000000000000000000000009a6eb104f0d3459056ff502e3d34f82beb69bbd4000000000000000000000000ea674fdde714fd979de3edf0f56aa9716b898ec8000000000000000000000000000000000000000000000000000000000000000100f3436800000000000000000000000000000000000000000000000000000000'
    assert.strictEqual(result, expectedResult)
  })
})
