const checkEndpoint = _provider => {
  console.info('✔ Checking endpoint...')
  let timeoutReference
  const TIMEOUT_TIME = 2000

  const rejectAfterX = _x =>
    /* eslint-disable-next-line no-return-assign */
    new Promise((resolve, reject) => timeoutReference = setTimeout(reject, _x, new Error('Timed out!')))

  // NOTE: We can't use `ptokens-utils` `racePromise` for this because `ethers` is a hymn to OOP style
  // programming. And so when we pass the promise fxn we want (`_provider.send`), then the `racePromise`
  // tries to call it, we lose all reference to `this` inside `_provider.send`, which then throws an error.

  return Promise.race([ _provider.send('eth_blockNumber', []), rejectAfterX(TIMEOUT_TIME) ])
    .then(_blockNumberHex => parseInt(_blockNumberHex, 'hex'))
    .then(_blockNumber => console.info(`✔ Endpoint working! Block height: ${_blockNumber}`) || _provider)
    .catch(_err => Promise.reject(new Error(`Endpoint error: ${_err.message}`)))
    .finally(_ => clearTimeout(timeoutReference))
}

module.exports = { checkEndpoint }
