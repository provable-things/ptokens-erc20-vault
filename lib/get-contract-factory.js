const {
  getVaultAbi,
  getVaultBytecode,
  getUnwrapperAbi,
  getUnwrapperBytecode,
} = require('./get-contract-artifacts')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')

const getContractFactory = (_abi, _bytecode, _wallet) =>
  Promise.resolve(new ethers.ContractFactory(_abi, _bytecode, _wallet))

const getVaultContractFactory = _wallet =>
  Promise.all([ getVaultAbi(), getVaultBytecode() ])
    .then(([ _abi, _bytecode ]) => getContractFactory(_abi, _bytecode, _wallet))

const getUnwrapperContractFactory = _wallet =>
  Promise.all([ getUnwrapperAbi(), getUnwrapperBytecode() ])
    .then(([ _abi, _bytecode ]) => getContractFactory(_abi, _bytecode, _wallet))

module.exports = {
  getVaultContractFactory,
  getUnwrapperContractFactory
}
