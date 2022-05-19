const {
  identity,
  memoizeWith,
} = require('ramda')
const fs = require('fs')
const path = require('path')
const { getKeyFromObj } = require('./utils')

const ARTIFACT_OBJECT_NAME = 'Contract artifact'
const VAULT_RELATIVE_PATH = '../artifacts/contracts/Erc20Vault.sol/Erc20Vault.json'
const UNWRAPPER_RELATIVE_PATH = '../artifacts/contracts/weth-unwrapper/WEthUnwrapper.sol/WEthUnwrapper.json'

const getFullPathToArtifact = memoizeWith(identity, _relativePath =>
  path.resolve(__dirname, _relativePath)
)

const getArtifact = memoizeWith(identity, _path =>
  new Promise((resolve, reject) => {
    const exists = fs.existsSync(_path)
    exists
      ? resolve(require(_path))
      : reject(new Error('Artifact does not exist! Run `npx hardhat compile` to compile contracts!'))
  })
)

const parseVaultArtifact = _key =>
  getArtifact(getFullPathToArtifact(VAULT_RELATIVE_PATH))
    .then(_artifact => getKeyFromObj(ARTIFACT_OBJECT_NAME, _artifact, _key))

const parseUnwrapperArtifact = _key =>
  getArtifact(getFullPathToArtifact(UNWRAPPER_RELATIVE_PATH))
    .then(_artifact => getKeyFromObj(ARTIFACT_OBJECT_NAME, _artifact, _key))

const getVaultAbi = _ => parseVaultArtifact('abi')
const getVaultBytecode = _ => parseVaultArtifact('bytecode')

const getUnwrapperAbi = _ => parseUnwrapperArtifact('abi')
const getUnwrapperBytecode = _ => parseUnwrapperArtifact('bytecode')

module.exports = {
  getVaultAbi,
  getVaultBytecode,
  getUnwrapperAbi,
  getUnwrapperBytecode,
}
