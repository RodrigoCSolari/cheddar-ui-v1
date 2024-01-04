"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectedWallet = exports.DisconnectedWallet = void 0;
const NOT_CONNECTED = "Connect to NEAR";
// -----------------------------
// Default disconnected wallet
// SmartContract proxies start with this dummy wallet until the user chooses a wallet
// -----------------------------
class DisconnectedWallet {
    requestSignTransactions(transactions, callbackUrl, meta) {
        return Promise.resolve();
    }
    getAccountId() { return NOT_CONNECTED; }
    getDisplayableAccountId() {
        return this.getAccountId();
    }
    async getAccountBalance(accountId) { return "0"; }
    ;
    getNetwork() { return NOT_CONNECTED; }
    setNetwork(value) { throw Error("can't change network"); }
    // Note: Connection is started from the chrome-extension, so web pages don't get any info before the user decides to "connect"
    // Also pages don't need to create buttons/options to connect to different wallets, as long all wallets connect with Dapp-pages by using this API
    // potentially, a single DApp can be used to operate on multiple chains, since all requests are high-level and go thru the chrome-extension
    isConnected() { return false; }
    disconnect() { }
    ;
    connectionHelp() { window.open("https://wallet.near.org/"); }
    /**
     * isConnected or throws "wallet not connected"
     */
    checkConnected() { throw Error(NOT_CONNECTED); }
    /**
     * Just a single contract "view" call
     */
    async view(contract, method, args) {
        throw Error(NOT_CONNECTED);
    }
    /**
     * A single contract "payable" fn call
     */
    async call(contract, method, args, gas, attachedYoctos) {
        throw Error(NOT_CONNECTED);
    }
    /**
     * ASYNC. sends a BatchTransaction to the blockchain
     */
    async apply(bt) {
        throw Error(NOT_CONNECTED);
    }
    /**
     * ASYNC, low level generic access
     */
    queryChain(method, args) {
        throw Error(NOT_CONNECTED);
    }
}
exports.DisconnectedWallet = DisconnectedWallet;
//export singleton
exports.disconnectedWallet = new DisconnectedWallet();
