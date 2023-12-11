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
exports.NEP141Trait = void 0;
//JSON compatible struct ft_metadata
const base_smart_contract_1 = require("../wallet-api/base-smart-contract");
const nearAPI = __importStar(require("near-api-js"));
const conversions_1 = require("../util/conversions");
const bn_js_1 = require("bn.js");
const near_api_js_1 = require("near-api-js");
class NEP141Trait extends base_smart_contract_1.SmartContract {
    async ft_transfer(receiver_id, amount, memo) {
        return this.call("ft_transfer", { receiver_id: receiver_id, amount: amount, memo: memo }, (0, conversions_1.TGas)(200), "1"); //one-yocto attached
    }
    async ft_transfer_call(receiver_id, amount, msg, memo) {
        return this.call("ft_transfer_call", { receiver_id: receiver_id, amount: amount, memo: memo, msg: msg }, (0, conversions_1.TGas)(200), "1"); //one-yocto attached
    }
    async ft_transfer_call_without_send(receiver_id, amount, msg = "to farm") {
        return nearAPI.transactions.functionCall("ft_transfer_call", {
            receiver_id: receiver_id,
            amount: amount,
            msg
        }, new bn_js_1.BN("200000000000000"), 
        // new BN(gas), 
        new bn_js_1.BN(1));
    }
    async unstake_without_send(token, amount) {
        return nearAPI.transactions.functionCall("unstake", {
            token,
            amount,
        }, new bn_js_1.BN("200000000000000"), 
        // new BN(gas), 
        new bn_js_1.BN(1));
    }
    async ft_total_supply() {
        return this.viewWithoutAccount("ft_total_supply");
    }
    async ft_balance_of(accountId) {
        return this.viewWithoutAccount("ft_balance_of", { account_id: accountId });
    }
    async ft_metadata() {
        return this.viewWithoutAccount("ft_metadata");
    }
    async new(owner_id, owner_supply) {
        return this.call("new", { owner_id: owner_id, owner_supply: owner_supply });
    }
    /// Checks to see if an account is registered.
    storageBalance(accountId) {
        return this.viewWithoutAccount("storage_balance_of", { account_id: accountId || this.wallet.getAccountId() });
    }
    /// Registers a user with the farm.
    storageDeposit() {
        return this.call("storage_deposit", {}, (0, conversions_1.TGas)(25), "3000000000000000000000");
    }
    async storageDepositWithoutSend() {
        return near_api_js_1.transactions.functionCall("storage_deposit", {}, new bn_js_1.BN("200000000000000"), new bn_js_1.BN("3000000000000000000000"));
    }
}
exports.NEP141Trait = NEP141Trait;
