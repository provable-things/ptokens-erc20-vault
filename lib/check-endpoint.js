const checkEndpoint = _provider =>
  console.info('✔ Checking endpoint...') ||
  _provider
    .send('eth_blockNumber', [])
    .then(_blockNumber =>
      console.info(`✔ Endpoint working! Block height: ${parseInt(_blockNumber, 'hex')}`) || _provider
    )
    .catch(_err => Promise.reject(new Error(`Endpoint error: ${_err.message}`)))

module.exports = { checkEndpoint }
