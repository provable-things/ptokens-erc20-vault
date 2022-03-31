const deployContract = (_contractFactory, _constructorArgs = []) =>
  console.info('✔ Deployment tx sent, awaiting mining...') ||
  _contractFactory
    .deploy(..._constructorArgs)
    .catch(_err => Promise.reject(new Error(`${_err.message}\n✘ Deployment failed! See above for more info.`)))

module.exports = { deployContract }
