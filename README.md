# :page_with_curl: Provable pToken ERC20 Vault Smart-Contract

The __ETH__ smart-contract for the Provable __`ERC20 Token`__ Vault! This vault is used for bridges _from_ EVM-compliant chains, and via it we can bridge ALL compliant tokens via a single smart-contract.

&nbsp;

## :boom: Deployment Guide

After cloning the repository, first install the dependencies:

```
❍ npm i
```

Next, you need to fill in the the following information in the __`config.json`__:

 - __`ENDPOINT`__ An endpoint for the network you intend to deploy on.
 - __`GAS_PRICE`__ The gas price you intend to deploy the contracts with.
 - __`PRIVATE_KEY`__ A private key for an account adequately funded for the deployment.
 - __`WETH_ADDRESS`__ The address of the wrapped ETH token (or equivalent) for the network you're deploying on.
 - __`TOKENS_TO_SUPPORT`__ An array of ETH token address to support the bridging of. Leave the array empty if no tokens are to bridged initially.
 - __`ETHERSCAN_API_KEY`__ An __[etherscan](etherscan.io)__ API key, for use when verifying the contract.

Once the __`config.json`__ is filled in correctly, it'll look something like the following:

```
{
  "GAS_PRICE": 10e9,
  "TOKENS_TO_SUPPORT": [
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc1"
  ],
  "ETHERSCAN_API_KEY": "51M7KKS9R5CZ2KRPHM1IA87P2W9UP5PGHQ",
  "WETH_ADDRESS": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "PRIVATE_KEY": "2b18efff601d68188bf41da2f57a90c5f0250d4ebfbee5d13f262f0ef84c842a",
  "ENDPOINT": "https://aged-blue-field.rinkeby.quiknode.pro/4ebfbee5d13f262f0ef84c842f/",
}
```

Finally, deploy the vault to your chose network via the command:

```
❍ npx truffle migrate --network <network> --reset
```

Currently, there exists in the __`./truffle-config.js`__ configurations for the following __`<network>s`__

```
xDai
rinkeby
ropsten
ethMainnet
bscMainnet
bscTestnet
polygonMaticMainnet
```

Should you need to deploy to a different chain, inspect the existing configurations and make your own with values pertinent to that new chain.

Finally, to verify the deployed contract run:

```
❍ npx truffle run verify Erc20Vault --network <network>
```

&nbsp;

## :guardsman: Smart-Contract Tests:

After filling in the __`config.json`__ per the information above, to run the tests first start truffle:

```
❍ pnpx truffle develop
```

Then Run the tests via:

```
❍ truffle_develop> test
```

Test output:

```

  Contract: Erc20Vault
    ✓ PNETWORK_ADDRESS can add appoved token address (188ms)
    ✓ NON_PNETWORK_ADDRESS cannot add appoved token address (176ms)
    ✓ PNETWORK_ADDRESS can remove appoved token address (278ms)
    ✓ NON_PNETWORK_ADDRESS cannot remove appoved token address (279ms)
    ✓ Should NOT peg in if token is not supported (98ms)
    ✓ Should NOT peg in if token is supported but insufficient allowance approved (234ms)
    ✓ Should NOT peg in if token is supported and sufficient allowance approved, but token amount is 0 (206ms)
    ✓ Should peg in if token is supported and sufficient allowance approved (459ms)
    ✓ NON_PNETWORK_ADDRESS cannot peg out (374ms)
    ✓ PNETWORK_ADDRESS cannot peg out if insufficient balance (154ms)
    ✓ PNETWORK_ADDRESS can peg out with sufficient balance (503ms)
    ✓ PNETWORK_ADDRESS can migrate (842ms)
    ✓ Non PNETWORK_ADDRESS cannot migrate (91ms)
    ✓ Token addresses sent to constructor should be supported (356ms)
    ✓ PNETWORK_ADDRESS can migrate single (648ms)
    ✓ Non PNETWORK_ADDRESS cannot migrateSingle (62ms)
    ✓ Automatically pegIn on ERC777 send (653ms)
    ✓ Should pegIn an ERC777 (722ms)
    ✓ PNETWORK_ADDRESS can migrate with ERC777 (1023ms)
    ✓ Should peg in wETH (278ms)
    ✓ Should peg out wETH (428ms)
    ✓ Should peg in with user data (496ms)
    ✓ Should peg in WETH_CONTRACT with user data (347ms)
    ✓ Can peg out with user data (972ms)
    ✓ Should migrate all token balances (4023ms)
    ✓ Should peg out wETH to smart-contract w/ expensive fallback function (480ms)
    ✓ Should be able to peg out wETH with user data to a smart-contract (457ms)
    ✓ Should not fail to peg out wETH with user data to an EOA (348ms)
    ✓ PNETWORK_ADDRESS can change PNETWORK_ADDRESS (228ms)
    ✓ NON_PNETWORK_ADDRESS cannot change PNETWORK_ADDRESS (111ms)
    ✓ Should not be able to set pNetwork address to the zero address (119ms)


  31 passing (41s)

```
