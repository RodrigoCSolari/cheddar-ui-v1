"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callMulipleTransactions = void 0;
const near_api_js_1 = require("near-api-js");
const borsh_1 = require("borsh");
const __1 = require("..");
async function callMulipleTransactions(txPromiseArray, contract) {
    let promises = [];
    for (let i = 0; i < txPromiseArray.length; i++) {
        promises.push(txPromiseArray[i].promise);
    }
    const resultPromises = await Promise.all(promises);
    let transactions = [];
    for (let i = 0; i < resultPromises.length; i++) {
        transactions.push(await makeTransaction(txPromiseArray[i].contractName, [resultPromises[i]], contract));
    }
    await contract.nearWallet.requestSignTransactions(transactions, window.location.href);
}
exports.callMulipleTransactions = callMulipleTransactions;
async function makeTransaction(receiverId, actions, contract, nonceOffset = 1) {
    const [accessKey, block] = await Promise.all([
        contract.account.accessKeyForTransaction(receiverId, actions),
        __1.near.connection.provider.block({ finality: "final" })
    ]);
    if (!accessKey) {
        throw new Error(`Cannot find matching key for transaction sent to ${receiverId}`);
    }
    const blockHash = (0, borsh_1.baseDecode)(block.header.hash);
    const publicKey = near_api_js_1.utils.PublicKey.from(accessKey.public_key);
    const nonce = accessKey.access_key.nonce + nonceOffset;
    return near_api_js_1.transactions.createTransaction(contract.wallet.getAccountId(), publicKey, receiverId, nonce, actions, blockHash);
}
