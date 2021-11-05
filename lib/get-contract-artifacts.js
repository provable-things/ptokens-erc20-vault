const {
  identity,
  memoizeWith,
} = require('ramda')
const fs = require('fs')
const path = require('path')
const { getKeyFromObj } = require('./utils')

const ARTIFACT_OBJECT_NAME = 'Contract artifact'

const getFullPathToArtifact = memoizeWith(identity, _ =>
  path.resolve(__dirname, '../artifacts/contracts/Erc20Vault.sol/Erc20Vault.json')
)

const getArtifact = memoizeWith(identity, _path =>
  new Promise((resolve, reject) => {
    const exists = fs.existsSync(_path)
    exists
      ? resolve(require(getFullPathToArtifact()))
      : reject(new Error('Artifact does not exist! Run `npx hardhat compile` to compile contracts!'))
  })
)

const getKeyFromArtifactObj = _key =>
  getArtifact(getFullPathToArtifact())
    .then(_artifact => getKeyFromObj(ARTIFACT_OBJECT_NAME, _artifact, _key))

const getAbi = _ => getKeyFromArtifactObj('abi')

const getBytecode = _ => getKeyFromArtifactObj('bytecode')

module.exports = {
  getBytecode,
  getAbi,
}
