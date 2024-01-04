"use strict";
//----------------------------------
// stnear Token smart-contract proxy for
// https://github.com/Narwallets/meta-pool
//----------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingPoolP1 = void 0;
const conversions_1 = require("../util/conversions");
const base_smart_contract_1 = require("../wallet-api/base-smart-contract");
const near_api_js_1 = require("near-api-js");
const bn_js_1 = require("bn.js");
const disconnected_wallet_1 = require("../wallet-api/disconnected-wallet");
//singleton class
class StakingPoolP1 extends base_smart_contract_1.SmartContract {
    /// Returns contract params
    get_contract_params() {
        return this.viewWithoutAccount("get_contract_params", {});
    }
    /// Returns amount of staked NEAR and farmed CHEDDAR of given account.
    status(accountId) {
        if (this.wallet === disconnected_wallet_1.disconnectedWallet) {
            return Promise.resolve(["-", "-", "-"]);
        }
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
    stake(amount) {
        return this.call("stake", {}, (0, conversions_1.TGas)(25), amount.toString());
    }
    /// Unstakes given amount of $NEAR and transfers it back to the user.
    /// Returns amount of staked tokens left after the call.
    /// Panics if the caller doesn't stake anything or if he doesn't have enough staked tokens.
    /// Requires 1 yNEAR payment for wallet validation.
    unstake(amount) {
        return this.call("unstake", { amount: amount }, (0, conversions_1.TGas)(125), "1");
    }
    // unstake(token: string, amount: string): Promise<void> {
    //     return this.call("unstake", { token: token, amount: amount }, TGas(125), "1")
    // }
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
exports.StakingPoolP1 = StakingPoolP1;
