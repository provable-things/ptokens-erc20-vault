# :page_with_curl: Provable pToken ERC20 Vault Smart-Contract

This repo houses the upgradeable ERC20-Vault logic smart-contract, as well as a simple CLI to help with deployment, verification & interacting with it.

&nbsp;

## :boom: Usage Guide:

After cloning the repository, first install the dependencies:

```
> npm ci
```

Then, to see the usage guide, run:

```
> ./cli.js --help
```

Output:

```
❍ pTokens ERC20 Vault Command Line Interface

  Copyright Provable Things 2021
  Questions: greg@oraclize.it

❍ Info:

  A tool to aid with deployments of & interactions with the upgradeable pToken ERC20 vault logic contract.

  NOTE: Functions that make transactions require a private key. Please provide a GPG encrpyted file called
    'private-key.gpg' containing your key in the root of the repository. Create one via:
    'echo <your-private-key> | gpg -c --output private-key.gpg'
    Multiple private keys may be provisioned, and the tool will provide you with a list to select from.

  NOTE: The tool requires a '.env' file to exist in the root of the repository with the following info:
    ENDPOINT=<rpc-endpoint-for-blochain-to-interact-with>
    Multiple such files may be provisioned, and the tool will provide you with a list to select from.

  NOTE: To call functions which verify contracts, the following extra environment variable is required:
    ETHERSCAN_API_KEY=<api-key-for-automated-contract-verifications>

❍ Usage:
  cli.js --help
  cli.js --version
  cli.js flattenContract
  cli.js showSuggestedFees
  cli.js showWalletDetails
  cli.js deployVaultContract
  cli.js showExistingContracts
  cli.js getPNetwork <deployedAddress>
  cli.js getWEthAddress <deployedAddress>
  cli.js getSupportedTokens <deployedAddress>
  cli.js deployUnwrapperContract <wEthAddress>
  cli.js setPNetwork <deployedAddress> <ethAddress>
  cli.js verifyVaultContract <network> <deployedAddress>
  cli.js isTokenSupported <deployedAddress> <ethAddress>
  cli.js addSupportedToken <deployedAddress> <ethAddress>
  cli.js setWEthUnwrapperAddress <deployedAddress> <ethAddress>
  cli.js verifyUnwrapperContract <network> <deployedAddress> <wEthAddress>
  cli.js encodeInitArgs <wEthAddress> <originChainId> [--token=<ethAddress>...]
  cli.js pegIn <deployedAddress> <amount> <tokenAddress> <destinationAddress> <destinationChainId> [--userData=<hex>]

❍ Commands:
  setPNetwork              ❍ Set the pNetwork address.
  showSuggestedFees        ❍ Show 'ethers.js' suggested fees.
  deployUnwrapperContract  ❍ Deploy the WETH unwrapper contract.
  deployVaultContract      ❍ Deploy the ERC20 vault logic contract.
  verifyVaultContract      ❍ Verify a deployed pToken logic contract.
  verifyUnwrapperContract  ❍ Verify a deployed WETH unwrapper contract.
  getPNetwork              ❍ Show the pNetwork address of the vault at <deployedAddress>.
  getWEthAddress           ❍ Show the wETH address set in the vault at <deployedAddress>.
  flattenContract          ❍ Flatten the contract in case manual verification is required.
  getSupportedTokens       ❍ Show list of tokens supprted by the vault at <deployedAddress>.
  showWalletDetails        ❍ Decrypts the private key and shows address & balance information.
  isTokenSupported         ❍ Is token at <ethAddress> supported in vault at <deployedAddress>.
  encodeInitArgs           ❍ Calculate the initializer function arguments in ABI encoded format.
  showExistingContracts    ❍ Show list of existing logic contract addresses on various blockchains.
  addSupportedToken        ❍ Adds token at <ethAddress> to the supported tokens in vault at <deployedAddress>.
  pegIn                    ❍ Peg in <amount> of <tokenAddress> to <destinationAddress> on <destinationChainId>.
  setWEthUnwrapperAddress  ❍ Sets the WETH unwrapper contract at <ethAddress> in the vault at <deployedAddress>.

❍ Options:
  --help                   ❍ Show this message.
  --version                ❍ Show tool version.
  <ethAddress>             ❍ A valid ETH address.
  <tokenAddress>           ❍ ETH address of token.
  <deployedAddress>        ❍ The ETH address of the deployed vault.
  <destinationAddress>     ❍ Destination address of a token peg in.
  --userData=<hex>         ❍ User data in hex format [default: 0x].
  --token=<ethAddress>     ❍ ETH addresses of tokens the vault will support.
  <amount>                 ❍ Amount of tokens in their most granular format.
  <originChainId>          ❍ Metadata chain ID of the chain this contract is deployed to.
  <destinationChainId>     ❍ Metadata chain ID of the chains this contract supports peg-ins to.
  <wEthAddress>            ❍ The address for the wrapped ETH token on the blockchain to be deployed to.
  <network>                ❍ Network the vault is deployed on. It must exist in the 'hardhat.config.json'.

```

&nbsp;

### :black_nib: Notes:

 - To simplify deployments, the tool uses __`ethers.js`__ suggested fees for deployment. The CLI function __`showSuggestedFees`__ will show you the currently suggested fees, including __[EIP1559](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1559.md)__ specific values if the chain you're working with is EIP1559 compaible.

 - In case the chain you're deploying to does not have etherscan-style contract verification which works with the hardhat plugin, there exists the __`flattenContract`__ command. This will flatten the __`pToken`__ contract into a single __`.sol`__ file that can then be used for manual verification.

&nbsp;

### :guardsman: Smart-Contract Tests:

1) Install dependencies

```
❍ npm ci
```

2) Run the tests via:

```
❍ npm run tests
```

Test output:

```

  Erc20Vault Tests
    Initalizer Tests
      ✓ Token addresses sent to constructor should be supported (250ms)
    Ownership Tests
      ✓ PNETWORK_ADDRESS can change PNETWORK_ADDRESS (55ms)
      ✓ NON_PNETWORK_ADDRESS cannot change PNETWORK_ADDRESS (62ms)
      ✓ Should not be able to set pNetwork address to the zero address
    Token Approval Tests
      ✓ PNETWORK_ADDRESS can add appoved token address
      ✓ NON_PNETWORK_ADDRESS cannot add appoved token address
      ✓ PNETWORK_ADDRESS can remove appoved token address
      ✓ NON_PNETWORK_ADDRESS cannot remove appoved token address
    Peg In Tests
      ✓ Should NOT peg in if token is not supported
      ✓ Should NOT peg in if token is supported but insufficient allowance approved
      ✓ Should NOT peg in supported token if sufficient allowance approved, but token amount is 0
      ✓ Should peg in if token is supported and sufficient allowance approved (54ms)
      ✓ Should peg in with user data (47ms)
    ERC777 Peg In Tests
      ✓ Should automatically peg in on ERC777 send (41ms)
      ✓ Should peg in an ERC777 token
    Peg Out Tests
      ✓ NON_PNETWORK_ADDRESS cannot peg out (45ms)
      ✓ PNETWORK_ADDRESS cannot peg out if insufficient balance
      ✓ PNETWORK_ADDRESS can peg out with sufficient balance (61ms)
      ✓ Can peg out with user data (70ms)
      ✓ Pegging out to ERC777 recipient with user data will call tokens recieved hook (91ms)
    wETH Tests
      Peg In wETH Tests
        ✓ Should peg in wETH
        ✓ Should peg in wETH with user data
      Peg Out wETH Tests
        ✓ Should peg out wETH without user data
        ✓ Should peg out wETH with user data
        ✓ Should peg out wETH to smart-contract w/ expensive fallback function (56ms)
        ✓ Should be able to peg out wETH with user data to a smart-contract (69ms)
        ✓ Should not fail to peg out wETH with user data to an EOA
        ✓ Pegging out wETH Should not be susceptible to re-entrancy attack (55ms)


  28 passing (8s)

```

&nbsp;

## :white_medium_square: To Do:

[ ] Allow custom gas prices in CLI?
