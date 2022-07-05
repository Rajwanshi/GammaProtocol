// import { default as Web3 } from 'web3'
// import * as fs from 'fs'
// import * as Tx from 'ethereumjs/tx'
const Tx = require('ethereumjs-tx').Transaction
const Web3 = require('web3')
const fs = require('fs')
const { add } = require('date-fns')

const ActionType = {
  OPENVAULT: 'OpenVault',
  MintShortOption: 'MintShortOption',
  BurnShortOption: 'BurnShortOption',
  DepositLongOption: 'DepositLongOption',
  WithdrawLongOption: 'WithdrawLongOption',
  DepositCollateral: 'DepositCollateral',
  WithdrawCollateral: 'WithdrawCollateral',
  SettleVault: 'SettleVault',
  Redeem: 'Redeem',
  Call: 'Call',
  Liquidate: 'Liquidate',
}
const DEV_MODE_ON = true
const INFURA_KEY_ROPSTEN = 'https://ropsten.infura.io/v3/b94cd6cdb99e41b9a8784c675060afc1'
const PKEY = DEV_MODE_ON ? '0xb1d47c576d09cc86fe925a1b536f03b8f9278fb9c28ab35f7815817e28668355' : ''
const OWNER_ADRESS = DEV_MODE_ON
  ? '0x280CbD785B928705c8871cc709477b2c6e339A9F'
  : '0x0bc29635CA2C99eFc1DA2be0Acc9E4fFBe01bd0F'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_ROPSTEN_ADDRESS = 0x27415c30d8c87437becbd4f98474f26e712047f4
const WETH_ROPSTEN_ADDRESS = 0xc778417e063141139fce010982780140aa0cd5ab
const USDC_MAINNET_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const WETH_MAINNET_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

const contractAddresses = DEV_MODE_ON
  ? // Local ganache chain contract addresses
    {
      AddressBook: '0x9650bf4f5cc77e558BE76b308D7840B3cd1cAE7E',
      Whitelist: '0x6b16bbAe1d94f18Af3f3773e1ec6DBE394FF6DEc',
      Controller: '0xF02348fEe1b47F4EA09522bE319d240f736a7C2E',
      OtokenFactory: '0x973C275d5e957533C4632769b553b526Bb03c3dD',
    }
  : // Ropsten contract addresses
    {
      AddressBook: '0x46E702972e766f5ab218d63932eFe383272aF26B',
      Controller: '0x324Ad0eF049B5D257b70a62B55CF00B4cBaABF23',
    }

////////////////////////////////////////////////////////
let web3
initEnv()
const addressBookSC = initSmartContract(contractAddresses['AddressBook'], './build/contracts/AddressBook.json')
const controllerSC = initSmartContract(contractAddresses['Controller'], './build/contracts/Controller.json')
const whitelistSC = initSmartContract(contractAddresses['Whitelist'], './build/contracts/Whitelist.json')
const otokenFactorySC = initSmartContract(contractAddresses['OtokenFactory'], './build/contracts/OtokenFactory.json')

// CONTROLLER
//runOperate(controllerSC, ActionType.OPENVAULT)

// OTOKENFACTORY
excCreateOToken(10, 1200, true)

// ADDRESSBOOK
//runGetVault(700)
//runGetWhitelist()
//runGetController()
//runGetOTokenFactory()
//runGetOtokenImpl()

// WHITELIST
//excWhitelistCollateral()
//excWhitelistCallee()
//excIsWhitelistedCallee()
//excIsWhitelistedCollateral()
//excWhitelistProduct()
//excIsWhitelistedProduct()
//
///////////////////////////////////////////////////////
// Funtions declaration -

function initEnv() {
  web3 = new Web3(DEV_MODE_ON ? 'http://127.0.0.1:8545' : new Web3.providers.HttpProvider(INFURA_KEY_ROPSTEN))

  if (DEV_MODE_ON) {
    // add local ganache test net owner address to web3.eth account wallet.
    web3.eth.accounts.wallet.add({
      privateKey: PKEY,
      address: OWNER_ADRESS,
    })
  }
}

function initSmartContract(contractAddresses, contractBuildPath) {
  const contractBuild = JSON.parse(fs.readFileSync(contractBuildPath))
  const smartContract = new web3.eth.Contract(contractBuild.abi, web3.utils.toChecksumAddress(contractAddresses))

  return smartContract
}

function excCreateOToken(days, strikePrice, isPut) {
  const date = new Date()
  // set UTC date 8:00
  date.setDate(date.getUTCDate() + days)
  date.setHours(8)
  date.setMinutes(0)
  date.setSeconds(0)

  const expiryTime = web3.utils.toBN(Math.floor(date.getTime() / 1000) - 66600)

  otokenFactorySC.methods
    .createOtoken(
      web3.utils.toChecksumAddress(WETH_MAINNET_ADDRESS),
      web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS),
      web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS),
      strikePrice.toString(),
      expiryTime,
      isPut,
    )
    .send({ from: OWNER_ADRESS, gas: 100000 })
    .on('transactionHash', function (hash) {
      console.log('Transaction hash')
      console.log(hash)
    })
    .on('confirmation', function (confirmationNumber, receipt) {
      console.log('Confirmation log')
      console.log(confirmationNumber)
      //console.log(receipt)
    })
    .on('receipt', function (receipt) {
      console.log('Receipt log')
      console.log(receipt)
    })
}

function runGetController() {
  // set methods cannot be called by the owner as it uses multisig for deployment.
  addressBookSC.methods
    .getController()
    .call()
    .then((val) => {
      console.log(val)
    })
}

function runGetWhitelist() {
  // set methods cannot be called by the owner as it uses multisig for deployment.
  addressBookSC.methods
    .getWhitelist()
    .call()
    .then((val) => {
      console.log(val)
    })
}

function runGetOTokenFactory() {
  // set methods cannot be called by the owner as it uses multisig for deployment.
  addressBookSC.methods
    .getOtokenFactory()
    .call()
    .then((val) => {
      console.log(val)
    })
}

function runGetOtokenImpl() {
  addressBookSC.methods.getOtokenImpl().call({ from: OWNER_ADRESS }, function (error, result) {
    console.log(result)
  })
}

function runOperate(smartContract, actionType) {
  let val
  switch (actionType) {
    case ActionType.OPENVAULT:
      DEV_MODE_ON
        ? excOpenVaultMethod(smartContract)
        : _excRawTransaction(
            contractAddresses['Controller'],
            smartContract.methods.operate(_getOperateArgs(actionType)).encodeABI(),
          )
      break

    case ActionType.DepositCollateral:

    default:
    //no-ops.
  }

  return val
}

function runGetVault(vaultId) {
  controllerSC.methods
    .getVault(OWNER_ADRESS, vaultId)
    .call()
    .then((val) => {
      console.log(val)
    })
}

function excDepositCollateralMethod() {
  controllerSC.methods
    .operate(_getOperateArgs(ActionType.OPENVAULT))
    .send({ from: OWNER_ADRESS, gas: 100000 })
    .on('transactionHash', function (hash) {
      console.log('Transaction hash')
      console.log(hash)
    })
    .on('confirmation', function (confirmationNumber, receipt) {
      console.log('Confirmation log')
      console.log(confirmationNumber)
      //console.log(receipt)
    })
    .on('receipt', function (receipt) {
      console.log('Receipt log')
      console.log(receipt)
    })
}

function excWhitelistProduct() {
  whitelistSC.methods
    .whitelistProduct(
      web3.utils.toChecksumAddress(WETH_MAINNET_ADDRESS),
      web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS),
      web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS),
      true,
    )
    .send({ from: OWNER_ADRESS, gas: 100000 })
    .on('transactionHash', function (hash) {
      console.log('Transaction hash')
      console.log(hash)
    })
    .on('confirmation', function (confirmationNumber, receipt) {
      console.log('Confirmation log')
      console.log(confirmationNumber)
      //console.log(receipt)
    })
    .on('receipt', function (receipt) {
      console.log('Receipt log')
      console.log(receipt)
    })
}

function excIsWhitelistedProduct() {
  whitelistSC.methods
    .isWhitelistedProduct(
      web3.utils.toChecksumAddress(WETH_MAINNET_ADDRESS),
      web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS),
      web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS),
      true,
    )
    .call({ from: OWNER_ADRESS }, function (error, result) {
      console.log(result)
    })
}

function excWhitelistCollateral() {
  whitelistSC.methods
    .whitelistCollateral(web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS))
    .send({ from: OWNER_ADRESS, gas: 100000 })
    .on('transactionHash', function (hash) {
      console.log('Transaction hash')
      console.log(hash)
    })
    .on('confirmation', function (confirmationNumber, receipt) {
      console.log('Confirmation log')
      console.log(confirmationNumber)
      //console.log(receipt)
    })
    .on('receipt', function (receipt) {
      console.log('Receipt log')
      console.log(receipt)
    })
}

function excIsWhitelistedCallee() {
  whitelistSC.methods
    .isWhitelistedCallee(web3.utils.toChecksumAddress(OWNER_ADRESS))
    .call({ from: OWNER_ADRESS }, function (error, result) {
      console.log(result)
    })
}

function excWhitelistCallee() {
  whitelistSC.methods
    .whitelistCallee(web3.utils.toChecksumAddress(OWNER_ADRESS))
    .send({ from: OWNER_ADRESS, gas: 100000 })
    .on('transactionHash', function (hash) {
      console.log('Transaction hash')
      console.log(hash)
    })
    .on('confirmation', function (confirmationNumber, receipt) {
      console.log('Confirmation log')
      console.log(confirmationNumber)
      //console.log(receipt)
    })
    .on('receipt', function (receipt) {
      console.log('Receipt log')
      console.log(receipt)
    })
}

function excIsWhitelistedCollateral() {
  whitelistSC.methods
    .isWhitelistedCollateral(web3.utils.toChecksumAddress(USDC_MAINNET_ADDRESS))
    .call({ from: OWNER_ADRESS }, function (error, result) {
      console.log(result)
    })
}

function excOpenVaultMethod(smartContract) {
  smartContract.methods
    .operate(_getOperateArgs(ActionType.OPENVAULT))
    .send({ from: OWNER_ADRESS, gas: 1000000 }) //1000000
    .on('transactionHash', function (hash) {
      console.log('Transaction hash')
      console.log(hash)
    })
    .on('confirmation', function (confirmationNumber, receipt) {
      console.log('Confirmation log')
      console.log(confirmationNumber)
      //console.log(receipt)
    })
    .on('receipt', function (receipt) {
      console.log('Receipt log')
      console.log(receipt)
    })
}

function _excRawTransaction(contractAddress, transactionData) {
  const promises = []
  let gasPrice, nonce, gasLimit, estGasPrice

  promises.push(
    web3.eth.getGasPrice().then((result) => {
      gasPrice = result // + 1000000;
    }),
  )

  promises.push(
    web3.eth.getTransactionCount(OWNER_ADRESS).then((result) => {
      nonce = result
      // return web3.eth.estimateGas({
      //     "nonce"     : nonce,
      //     "to"        : contractAddress,
      //     "data"      : transactionData,
      // })
    }) /*.then((est) => {
        estGasPrice = est + 1000000
    })*/,
  )

  promises.push(
    web3.eth.getBlock('latest').then((block) => {
      gasLimit = block.gasLimit
    }),
  )

  Promise.all(promises).then(() => {
    const tx = {
      nonce: web3.utils.toHex(nonce),
      from: OWNER_ADRESS,
      to: contractAddress,
      gasPrice: web3.utils.toHex(gasPrice),
      gasLimit: gasLimit,
      value: '0x0',
      data: transactionData,
    }
    web3.eth.accounts
      .signTransaction(tx, PKEY)
      .then((signedTx) => {
        const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction)
        sentTx.on('receipt', (receipt) => {
          console.log(receipt)
          // do something when receipt comes back
        })
        sentTx.on('error', (err) => {
          console.log(err)
          // do something on transaction error
        })
      })
      .catch((err) => {
        console.log(err)
        // do something when promise fails
      })
  })
}

function _getOperateArgs(actionType) {
  let args = []
  switch (actionType) {
    case ActionType.OPENVAULT:
      args = [
        {
          actionType: 0,
          owner: OWNER_ADRESS,
          secondAddress: ZERO_ADDRESS,
          asset: ZERO_ADDRESS,
          vaultId: 1,
          amount: 0,
          index: 0,
          data: ZERO_ADDRESS,
        },
      ]
      break

    case ActionType.DepositCollateral:
      args = [
        {
          actionType: 1,
          owner: OWNER_ADRESS,
          secondAddress: OWNER_ADRESS,
          asset: USDC,
          vaultId: 1, // deposit to the first vault
          amount: 100 * 1e6, // deposit 100 USDC
          index: 0,
          data: ZERO_ADDRESS,
        },
      ]
    default:
    // no-ops.
  }

  return args
}
