"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartContract = void 0;
const disconnected_wallet_1 = require("./disconnected-wallet");
const nearAPI = __importStar(require("near-api-js"));
const __1 = require("..");
const providers_1 = require("near-api-js/lib/providers");
//-----------------------------
// Base smart-contract proxy class
// provides constructor, view & call methods
// derive your specific contract proxy from this class
//-----------------------------
class SmartContract {
    constructor(contractId) {
        this.contractId = contractId;
        this.wallet = disconnected_wallet_1.disconnectedWallet; //default wallet is DisconnectedWallet
        this.nearWallet = new nearAPI.WalletAccount(__1.near, null);
        this.account = this.nearWallet.account();
        this.provider = new providers_1.JsonRpcProvider(__1.nearConfig.nodeUrl);
    }
    async viewWithoutAccount(method, args = {}) {
        try {
            const argsAsString = JSON.stringify(args);
            let argsBase64 = Buffer.from(argsAsString).toString("base64");
            const rawResult = await this.provider.query({
                request_type: "call_function",
                account_id: this.contractId,
                method_name: method,
                args_base64: argsBase64,
                finality: "optimistic",
            });
            // format result
            const res = JSON.parse(Buffer.from(rawResult.result).toString());
            return res;
        }
        catch (err) {
            console.error(`Error calling function ${method} from contract ${this.contractId} with params ${JSON.stringify(args)}`, err);
        }
    }
    view(method, args) {
        if (!this.wallet)
            throw Error(`contract-proxy not connected ${this.contractId} trying to view ${method}`);
        return this.wallet.view(this.contractId, method, args);
    }
    call(method, args, gas, attachedYoctos) {
        //console.log(this.contractId, method, args, gas, attachedYoctos)
        if (!this.wallet)
            throw Error(`contract-proxy not connected ${this.contractId} trying to call ${method}`);
        return this.wallet.call(this.contractId, method, args, gas, attachedYoctos);
    }
    callWithoutSend(method, args, gas, attachedYoctos) {
        //console.log(this.contractId, method, args, gas, attachedYoctos)
        if (!this.nearWallet)
            throw Error(`contract-proxy not connected ${this.contractId} trying to call ${method}`);
        return this.nearWallet.call(this.contractId, method, args, gas, attachedYoctos);
    }
    disconnect() {
        this.wallet = disconnected_wallet_1.disconnectedWallet; //set to DisconnectedWallet
    }
}
exports.SmartContract = SmartContract;
