import { default as Web3} from 'web3';
import * as fs from 'fs';

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
    Liquidate: 'Liquidate'
};
const contractAddresses = {
    'AddressBook' : '0x46E702972e766f5ab218d63932eFe383272aF26B',
    'Controller' : '0x324Ad0eF049B5D257b70a62B55CF00B4cBaABF23'
};
const INFURA_KEY_ROPSTEN = "https://ropsten.infura.io/v3/b94cd6cdb99e41b9a8784c675060afc1";
const PKEY = "23293fa0e07fa051d58ace2b2a92c79abb32fcf7aa75daef44c80f362e7a7363";
const OWNER_ADRESS = '0x0bc29635CA2C99eFc1DA2be0Acc9E4fFBe01bd0F';
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const USDC_ROPSTEN_ADDRESS = 0x27415c30d8c87437BeCbd4f98474f26E712047f4;
const WETH_ROPSTEN_ADDRESS = 0xc778417e063141139fce010982780140aa0cd5ab;


////////////////////////////////////////////////////////

var web3 = new Web3(new Web3.providers.HttpProvider(INFURA_KEY_ROPSTEN));

var addressBookSC = initSmartContract(contractAddresses['AddressBook'], './build/contracts/AddressBook.json');
var controllerSC = initSmartContract(contractAddresses['Controller'], './build/contracts/Controller.json');

var operateResult = await runOperate(controllerSC, ActionType.OPENVAULT);
console.log(operateResult);


///////////////////////////////////////////////////////
// Funtions declaration - 
function initSmartContract(contractAddresses, contractBuildPath){
    var contractBuild = JSON.parse(fs.readFileSync(contractBuildPath));

    var smartContract =  new web3.eth.Contract(
        contractBuild.abi,
        web3.utils.toChecksumAddress(contractAddresses));
    
    return smartContract;
}

function runOperate(smartContract, actionType){
    var val;
    switch(actionType){
        case ActionType.OPENVAULT:
            _excRawTransaction(contractAddresses['Controller'], smartContract.methods.operate(_getOperateArgs(actionType)).encodeABI());
            break;
        
        default:
            //no-ops.
    };

    return val;
}

function _excRawTransaction(contractAddress, transactionData){
    var nonce = web3.eth.getTransactionCount(OWNER_ADRESS);

    const rawTx =
    {
        nonce: web3.utils.toHex(nonce),
        //from: MainAccountAddress,
        to: contractAddress,
        gasPrice:  web3.eth.gasPrice,
        gasLimit: web3.eth.getBlock("latest").gasLimit,
        value: '0x0',
        data: transactionData
    };
    
    const tx = new Tx(rawTx, { 'chain': 'ropsten' });
    tx.sign(PKEY);
    
    var serializedTx = '0x' + tx.serialize().toString('hex');
    return web3.eth.sendSignedTransaction(serializedTx.toString('hex'), function (err, hash) {
        if (err) {
            reject(err);
        }
        else {
            resolve(hash);
        }
    })
}

function _getOperateArgs(actionType) {
    var args = [];
    switch(actionType){
        case ActionType.OPENVAULT:
            args = [{
                actionType: 0,
                owner: OWNER_ADRESS,
                secondAddress: ZERO_ADDRESS,
                asset: ZERO_ADDRESS,
                vaultId: 1, // open the first vault
                amount: 0,
                index: 0,
                data: ZERO_ADDRESS,
            }];
            break;
        default:
            // no-ops.
    }

    return args;
}
