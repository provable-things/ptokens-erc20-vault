const {
  PATH_TO_EXECUTE_FROM,
  TRUFFLE_BUILD_COMMAND,
} = require('./constants')
const { has } = require('ramda')
const { exec } = require('child_process')

const runTruffleCompile = (_command, _pathToExecuteFrom) =>
  new Promise((resolve, reject) => {
    exec(
      _command,
      { cwd: _pathToExecuteFrom },
      (err, stdout, stderr) => {
        const errorMessage = '✘ Error running command: ' + err + ', command output: ' + stdout
        if (!err)
          return resolve(stdout)
        else if (!has(err.code))
          return reject(new Error(errorMessage))
        else
          return reject(new Error(errorMessage + ', code: ' + err.code))
      })
  })

module.exports.runTruffleCompileAndReturnState = _state =>
  runTruffleCompile(TRUFFLE_BUILD_COMMAND, PATH_TO_EXECUTE_FROM)
    .then(_ => _state)
