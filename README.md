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

  Contract: pToken/ERC777GSN
    ✓ Should transfer via relayer (3687ms)
    ✓ When transferring via relay, it should pay fee in token (3033ms)

  Contract: pToken/ERC777WithAdminOperator
    ✓ OWNER cannot change the admin operator (1312ms)
    ✓ Admin operator can change the admin operator address (189ms)
    ✓ adminTransfer() should fail if the caller is not the admin operator (351ms)
    ✓ adminTransfer() should transfer tokens (1175ms)

  Contract: pToken
    ✓ `redeem()` function should burn tokens & emit correct events (8591ms)
    ✓ `mint()` w/out data should mint tokens & emit correct events (1545ms)
    ✓ `mint()` w/out data should return true if successful (718ms)
    ✓ `mint()` cannot mint to zero address (453ms)
    ✓ 'mint()' only 0x6acA...d1bE can mint (1200ms)
    ✓ `mint()` w/ data should mint tokens & emit correct events (879ms)
    ✓ 0x6acA...d1bE has 'admin' and 'minter' role (392ms)
    ✓ 0x6acA...d1bE can grant 'minter' role (539ms)
    ✓ 0x6acA...d1bE can revoke 'minter' role (730ms)
    ✓ newly added minter should be able to mint tokens & emit correct events (763ms)
    ✓ Should get redeem fxn call data correctly (2140ms)
    ✓ Should grant minter role to EOA (259ms)
    ✓ Should upgrade contract (2232ms)
    ✓ User balance should remain after contract upgrade (1796ms)
    ✓ Should revert when minting tokens with the contract address as the recipient (485ms)


  21 passing (2m)

```
