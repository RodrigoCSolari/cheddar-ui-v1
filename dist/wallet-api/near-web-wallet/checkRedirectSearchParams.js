"use strict";
// Calling contract methods with attachedDeposit causes a redirect to NEAR Wallet.
// later the wallet redirects the browser back to this app, adding 2 params in URLSearchParams
// ?transactionHashes=xxxxx & errorCode=eeeee
// this fn must be called to check if we're re-spawning from a wallet redirect
// to obtain transaction result information
// check if (`err`) and if not you can get function call result with `data`, and full-tx-result with `finalExecutionOutcome`
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRedirectSearchParamsMultiple = exports.checkRedirectSearchParams = void 0;
const near_api_js_1 = require("near-api-js");
const providers_1 = require("near-api-js/lib/providers");
const rpc_errors_1 = require("near-api-js/lib/utils/rpc_errors");
function removeQueryString() {
    var uri = window.location.toString();
    if (uri.indexOf("?") > 0) {
        var clean_uri = uri.substring(0, uri.indexOf("?"));
        window.history.replaceState({}, document.title, clean_uri);
    }
}
async function checkRedirectSearchParams(walletConnection, nearExplorerUrl) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        removeQueryString();
        const txHash = urlParams.get('transactionHashes');
        const errorCode = urlParams.get('errorCode');
        if (errorCode) {
            // If errorCode, then the redirect succeeded but the tx was rejected/failed
            const newError = 'Error from wallet: ' + errorCode;
            console.error(newError);
            return {
                err: newError
            };
        }
        if (!txHash)
            return {};
        if (txHash.includes(',')) {
            // NOTE: when a single tx is executed, transactionHashes is equal to that hash
            const newError = 'Expected single txHash, got: ' + txHash;
            console.error(newError);
            return {
                err: newError
            };
        }
        const decodedTxHash = near_api_js_1.utils.serialize.base_decode(txHash);
        const finalExecOutcome = await walletConnection.account().connection.provider.txStatus(decodedTxHash, walletConnection.getAccountId());
        let method = undefined;
        if (finalExecOutcome.transaction?.actions?.length) {
            const actions = finalExecOutcome.transaction.actions;
            //recover methodName of first FunctionCall action
            for (let n = 0; n < actions.length; n++) {
                let item = actions[n];
                if ("FunctionCall" in item) {
                    //@ts-ignore
                    method = item.FunctionCall.method_name;
                    break;
                }
            }
        }
        //@ts-ignore
        let failure = finalExecOutcome.status.Failure;
        if (failure) {
            console.error('finalExecOutcome.status.Failure', failure);
            const errorMessage = typeof failure === 'object' ? (0, rpc_errors_1.parseRpcError)(failure).toString()
                : `Transaction <a href="${nearExplorerUrl}/transactions/${finalExecOutcome.transaction.hash}">${finalExecOutcome.transaction.hash}</a> failed`;
            return {
                err: errorMessage,
                method: method,
            };
        }
        return {
            data: (0, providers_1.getTransactionLastResult)(finalExecOutcome),
            method: method,
            finalExecutionOutcome: finalExecOutcome
        };
    }
    catch (ex) {
        console.error(ex.message);
        return { err: ex.message };
    }
}
exports.checkRedirectSearchParams = checkRedirectSearchParams;
async function checkRedirectSearchParamsMultiple(walletConnection, nearExplorerUrl) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        removeQueryString();
        const txHash = urlParams.get('transactionHashes');
        const errorCode = urlParams.get('errorCode');
        if (errorCode) {
            // If errorCode, then the redirect succeeded but the tx was rejected/failed
            const newError = 'Error from wallet: ' + errorCode;
            console.error(newError);
            return [{
                    err: newError
                }];
        }
        if (!txHash)
            return [];
        let transactionArray;
        if (txHash.includes(',')) {
            // NOTE: when a single tx is executed, transactionHashes is equal to that hash
            transactionArray = txHash.split(",");
            // const newError = 'Expected single txHash, got: ' + txHash
            // console.error(newError)
            // return {
            //   err: newError
            // }
        }
        else {
            transactionArray = [txHash];
        }
        // [1, 3, 6].map(i => i + 3) --> [4, 6, 9]
        const decodedTxHashArray = transactionArray.map(hash => near_api_js_1.utils.serialize.base_decode(hash));
        const finalExecOutcomeArray = await Promise.all(decodedTxHashArray.map(async (decodedTxHash) => {
            return await walletConnection.account().connection.provider.txStatus(decodedTxHash, walletConnection.getAccountId());
        }));
        let output = [];
        for (let i = 0; i < finalExecOutcomeArray.length; i++) {
            let method = undefined;
            const finalExecOutcome = finalExecOutcomeArray[i];
            if (finalExecOutcome.transaction?.actions?.length) {
                const actions = finalExecOutcome.transaction.actions;
                //recover methodName of first FunctionCall action
                for (let n = 0; n < actions.length; n++) {
                    let item = actions[n];
                    if ("FunctionCall" in item) {
                        //@ts-ignore
                        method = item.FunctionCall.method_name;
                        break;
                    }
                }
            }
            //@ts-ignore
            let failure = finalExecOutcome.status.Failure;
            if (failure) {
                console.error('finalExecOutcome.status.Failure', failure);
                const errorMessage = typeof failure === 'object' ? (0, rpc_errors_1.parseRpcError)(failure).toString()
                    : `Transaction <a href="${nearExplorerUrl}/transactions/${finalExecOutcome.transaction.hash}">${finalExecOutcome.transaction.hash}</a> failed`;
                output.push({
                    err: errorMessage,
                    method: method,
                });
            }
            else {
                output.push({
                    data: (0, providers_1.getTransactionLastResult)(finalExecOutcome),
                    method: method,
                    finalExecutionOutcome: finalExecOutcome
                });
            }
        }
        return output;
    }
    catch (ex) {
        console.error(ex.message);
        return [{ err: ex.message }];
    }
}
exports.checkRedirectSearchParamsMultiple = checkRedirectSearchParamsMultiple;
