const {
  keys,
  prop,
  identity,
  memoizeWith,
} = require('ramda')

const checkEnvironmentVariableExists = _name =>
  console.info(`✔ Checking '${_name}' env var exists...`) ||
  new Promise((resolve, reject) =>
    keys(process.env).includes(_name)
      ? console.info('✔ Env var exists!') || resolve(_name)
      : reject(new Error(`No environment variable exists with name: '${_name}'`))
  )

const getEnvironmentVariable = memoizeWith(identity, _name =>
  checkEnvironmentVariableExists(_name)
    .then(_ => {
      const envVar = prop(_name, process.env)
      if (!_name.toLowerCase().includes('private'))
        console.info(`✔ Env var retrieved: ${envVar}`)

      return envVar
    })
)

module.exports = {
  checkEnvironmentVariableExists,
  getEnvironmentVariable,
}
