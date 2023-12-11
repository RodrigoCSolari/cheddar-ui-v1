"use strict";
//----------------------------------
// stnear Token smart-contract proxy for
// https://github.com/Narwallets/meta-pool
//----------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingPoolP3 = void 0;
const conversions_1 = require("../util/conversions");
const base_smart_contract_1 = require("../wallet-api/base-smart-contract");
const bn_js_1 = require("bn.js");
const near_api_js_1 = require("near-api-js");
//singleton class
class StakingPoolP3 extends base_smart_contract_1.SmartContract {
    /// Returns contract params
    get_contract_params() {
        return this.viewWithoutAccount("get_contract_params");
    }
    /// Returns amount of staked NEAR and farmed CHEDDAR of given account.
    status(accountId) {
        return this.viewWithoutAccount("status", { account_id: accountId || this.wallet.getAccountId() });
    }
    /// Checks to see if an account is registered.
    storageBalance(accountId) {
        return this.viewWithoutAccount("storage_balance_of", { account_id: accountId || this.wallet.getAccountId() });
    }
    /// Registers a user with the farm.
    storageDeposit() {
        return this.call("storage_deposit", {}, (0, conversions_1.TGas)(25), "60000000000000000000000");
    }
    /// Registers a user with the farm.
    async storageDepositWithoutSend() {
        return near_api_js_1.transactions.functionCall("storage_deposit", {}, new bn_js_1.BN("200000000000000"), new bn_js_1.BN("60000000000000000000000"));
    }
    /// Stake attached &NEAR and returns total amount of stake.
    ft_transfer_call(amount) {
        return this.call("ft_transfer_call", {}, (0, conversions_1.TGas)(25), amount);
    }
    withdraw_nft(receiver_id) {
        return this.call("withdraw_nft", { receiver_id: receiver_id }, (0, conversions_1.TGas)(200), "1"); //one-yocto attached
    }
    /// Unstakes given amount of $NEAR and transfers it back to the user.
    /// Returns amount of staked tokens left after the call.
    /// Panics if the caller doesn't stake anything or if he doesn't have enough staked tokens.
    /// Requires 1 yNEAR payment for wallet validation.
    unstake(token, amount) {
        return this.call("unstake", { token: token, amount: amount }, (0, conversions_1.TGas)(125), "1");
    }
    /// Unstakes everything and close the account. Sends all farmed CHEDDAR using a ft_transfer
    /// and all NEAR to the caller.
    /// Returns amount of farmed CHEDDAR.
    /// Panics if the caller doesn't stake anything.
    /// Requires 1 yNEAR payment for wallet validation.
    close() {
        return this.call("close", {}, (0, conversions_1.TGas)(75), "1");
    }
    withdraw_crop() {
        return this.call("withdraw_crop", {}, (0, conversions_1.TGas)(125));
    }
}
exports.StakingPoolP3 = StakingPoolP3;
