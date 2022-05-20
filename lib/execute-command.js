const { curry } = require('ramda')
const { exec } = require('child_process')

module.exports.executeCommand = curry((_logMsg, _cmd) =>
  console.info(_logMsg) ||
  new Promise((resolve, reject) =>
    exec(_cmd, (_err, _stdout, _stderr) =>
      _err ? reject(_err) : _stderr ? reject(_stderr) : resolve(_stdout))
  )
)
