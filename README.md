# :page_with_curl: Provable pToken ERC20 Vault Smart-Contract

The __ETH__ smart-contract for the Provable ERC20 Vault! This vault is used for bridges _from_ EVM-compliant chains, whereby we can bridge ALL tokens via a single instance. Each token supported by this vault (which can be seen on-chain by calling the __`getSupportedTokens()`__ function) will then have their own __[ERC777 pToken](https://github.com/provable-things/ptokens-erc777-smart-contract)__ on the counterparty chain.

&nbsp;

### :guardsman: Smart-Contract Tests:

1) Install dependencies:

```
❍ pnpm install
```

2) Start truffle via:

```
❍ pnpx truffle develop
```

3) Run the tests via:

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
