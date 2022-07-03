// import { default as Web3 } from 'web3'
// import * as fs from 'fs'
// import * as Tx from 'ethereumjs/tx'
const Tx = require('ethereumjs-tx').Transaction
var Web3 = require('web3');
const fs = require('fs');

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
const PKEY = DEV_MODE_ON ? '8e9d8415a5a5395fd267d1b7769fbfa3edb8bba2ab7cae1fb64ccc646e3059c8' : '23293fa0e07fa051d58ace2b2a92c79abb32fcf7aa75daef44c80f362e7a7363'
const OWNER_ADRESS = DEV_MODE_ON ? '0xf2A634C89D85Cf2e8fAf6Ebc27743cBb599a89De' : '0x0bc29635CA2C99eFc1DA2be0Acc9E4fFBe01bd0F'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_ROPSTEN_ADDRESS = 0x27415c30d8c87437becbd4f98474f26e712047f4
const WETH_ROPSTEN_ADDRESS = 0xc778417e063141139fce010982780140aa0cd5ab
const contractAddresses = DEV_MODE_ON ? 
// Local ganache chain contract addresses
{
  AddressBook: '0xBAAE2eA54b555ADaa550b721d6975F7600a88e59',
  //Whitelist: '0xC30e0677DbaAcFa7C1aC1A87EA636A12C8A29bbf',
  Controller: '0xBB15674D26a3Bd6c1EE9AEBE9098aa017AaC197A',
  OTokenFactory: '0xd197c455c4302baba4554b44480fe76b375B10c4'
} :
// Ropsten contract addresses
{
    AddressBook: '0x46E702972e766f5ab218d63932eFe383272aF26B',
    Controller: '0x324Ad0eF049B5D257b70a62B55CF00B4cBaABF23'
}

////////////////////////////////////////////////////////
var web3
initEnv()
const addressBookSC = initSmartContract(contractAddresses['AddressBook'], './build/contracts/AddressBook.json')
const controllerSC = initSmartContract(contractAddresses['Controller'], './build/contracts/Controller.json')

runOperate(controllerSC, ActionType.OPENVAULT)
runGetVault(700)
//runGetWhitelist()
//runGetController()

// 
///////////////////////////////////////////////////////
// Funtions declaration -

function initEnv(){
    web3 = new Web3(DEV_MODE_ON ? 
        "http://127.0.0.1:8545" :
        new Web3.providers.HttpProvider(INFURA_KEY_ROPSTEN))

    if(DEV_MODE_ON){
        // add local ganache test net owner address to web3.eth account wallet.
        web3.eth.accounts.wallet.add({
            privateKey: PKEY,
            address: OWNER_ADRESS
        });
    }
}

function initSmartContract(contractAddresses, contractBuildPath) {
  const contractBuild = JSON.parse(fs.readFileSync(contractBuildPath))
  const smartContract = new web3.eth.Contract(contractBuild.abi, web3.utils.toChecksumAddress(contractAddresses))

  return smartContract
}

function runGetController(){
    // set methods cannot be called by the owner as it uses multisig for deployment.
    addressBookSC.methods.getController().call().then((val) => {
        console.log(val)
    })
}

function runGetWhitelist(){
    // set methods cannot be called by the owner as it uses multisig for deployment.
    addressBookSC.methods.getMarginCalculator().call().then((val) => {
        console.log(val)
    })
}

function runOperate(smartContract, actionType) {
  let val
  switch (actionType) {
    case ActionType.OPENVAULT:
        DEV_MODE_ON ?
        excOpenVaultMethod(smartContract) :
        _excRawTransaction(
            contractAddresses['Controller'],
            smartContract.methods.operate(_getOperateArgs(actionType)).encodeABI())
      break

    case ActionType.DepositCollateral:

    default:
    //no-ops.
  }

  return val
}

function runGetVault(vaultId){
    controllerSC.methods.getVault(OWNER_ADRESS, vaultId).call().then((val) =>{
        console.log(val)
    })
}

function excDepositCollateralMethod(){
    controllerSC.methods.operate(_getOperateArgs(ActionType.OPENVAULT)).send({from: OWNER_ADRESS, gas: 100000})
    .on('transactionHash', function(hash){
        console.log('Transaction hash')
        console.log(hash)
    })
    .on('confirmation', function(confirmationNumber, receipt){
        console.log('Confirmation log')
        console.log(confirmationNumber)
        //console.log(receipt)
    })
    .on('receipt', function(receipt){
        console.log('Receipt log')
        console.log(receipt)
    })
}

function excOpenVaultMethod(smartContract){
    smartContract.methods.operate(_getOperateArgs(ActionType.OPENVAULT)).send({from: OWNER_ADRESS, gas: 100000})
    .on('transactionHash', function(hash){
        console.log('Transaction hash')
        console.log(hash)
    })
    .on('confirmation', function(confirmationNumber, receipt){
        console.log('Confirmation log')
        console.log(confirmationNumber)
        //console.log(receipt)
    })
    .on('receipt', function(receipt){
        console.log('Receipt log')
        console.log(receipt)
    })
}

function _excRawTransaction(contractAddress, transactionData) {
    var promises = []
    var gasPrice, nonce, gasLimit, estGasPrice

    promises.push(web3.eth.getGasPrice().then((result) => {
        gasPrice = result// + 1000000;
    }))

    promises.push(web3.eth.getTransactionCount(OWNER_ADRESS).then((result) => {
        nonce = result
        // return web3.eth.estimateGas({
        //     "nonce"     : nonce, 
        //     "to"        : contractAddress,     
        //     "data"      : transactionData,
        // })
    })/*.then((est) => {
        estGasPrice = est + 1000000
    })*/)

    promises.push(web3.eth.getBlock('latest').then((block) => {
        gasLimit = block.gasLimit
    }))

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
        web3.eth.accounts.signTransaction(tx, PKEY).then((signedTx) => {
            const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction);
            sentTx.on("receipt", receipt => {
                console.log(receipt)
                // do something when receipt comes back
            });
            sentTx.on("error", err => {
                console.log(err)
                // do something on transaction error
            });
            }).catch((err) => {
                console.log(err)
            // do something when promise fails
            });
        });
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
          vaultId: 3,
          amount: 0,
          index: 0,
          data: ZERO_ADDRESS
        }
      ]
      break

    case ActionType.DepositCollateral:
        args = [{
            actionType: 1,
            owner: OWNER_ADRESS,
            secondAddress: OWNER_ADRESS,
            asset: USDC,
            vaultId: 1, // deposit to the first vault
            amount: 100 * 1e6, // deposit 100 USDC
            index: 0,
            data: ZERO_ADDRESS,
        }]
    default:
    // no-ops.
  }

  return args
}
