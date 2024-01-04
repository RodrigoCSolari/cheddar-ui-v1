"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NearWebWallet = void 0;
const util_1 = require("../util");
const providers_1 = require("near-api-js/lib/providers");
const bn_js_1 = __importDefault(require("bn.js")); //WARN: It has to be the same bn.js version as near-api-js
//-----------------------------
// WalletInterface implementation
// for the NEAR Web Wallet
//-----------------------------
class NearWebWallet {
    constructor(walletConnection) {
        this.walletConnection = walletConnection;
    }
    getAccountId() {
        return this.walletConnection.getAccountId();
    }
    getDisplayableAccountId() {
        const accName = this.getAccountId();
        return accName.length > 22 ? accName.slice(0, 10) + ".." + accName.slice(-10) : accName;
    }
    async getAccountBalance(accountId) {
        const data = await this.walletConnection.account().getAccountBalance();
        return data.total;
    }
    getNetwork() { return this.walletConnection._near.connection.networkId; }
    setNetwork(value) { throw Error("can't change networkId"); }
    isConnected() {
        return this.walletConnection.isSignedIn();
    }
    disconnect() {
        this.walletConnection.signOut();
    }
    connectionHelp() {
        window.open("https://wallet.near.org/");
    }
    /**
     * isConnected or throws "wallet not connected"
     */
    checkConnected() {
        if (!this.walletConnection.isSignedIn()) {
            throw Error("Wallet is not connected");
        }
    }
    /**
     * Just a single contract "view" call
     */
    async view(contract, method, args) {
        return this.walletConnection.account().viewFunction(contract, method, args);
    }
    /**
     * A single contract "payable" fn call
     */
    async call(contract, method, args, gas, attachedYoctos) {
        //clear SearchURL before calling to not mix old results with new ones
        window.history.replaceState({}, '', location.pathname);
        const finalExecOutcome = await this.walletConnection.account().functionCall(contract, method, args, new bn_js_1.default(gas || util_1.DEFAULT_GAS), new bn_js_1.default(attachedYoctos || "0"));
        return (0, providers_1.getTransactionLastResult)(finalExecOutcome);
    }
    /**
     * ASYNC. sends a BatchTransaction to the blockchain
     */
    async apply(bt) {
        //TODO - implement BatchTransactions
        throw Error("Not implemented");
    }
    /**
     * ASYNC, low level generic access
     */
    async queryChain(method, args) {
        const provider = this.walletConnection._connectedAccount.connection.provider;
        return provider.sendJsonRpc(method, args);
    }
}
exports.NearWebWallet = NearWebWallet;
