const {
  getAbi,
  getBytecode,
} = require('./get-contract-artifacts')
const ethers = require('ethers')

const getContractFactory = (_abi, _bytecode, _wallet) =>
  Promise.resolve(new ethers.ContractFactory(_abi, _bytecode, _wallet))

const getVaultContractFactory = _wallet =>
  Promise.all([ getAbi(), getBytecode() ])
    .then(([ _abi, _bytecode ]) => getContractFactory(_abi, _bytecode, _wallet))

module.exports = { getVaultContractFactory }
