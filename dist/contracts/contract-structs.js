"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenParams = exports.ContractParams = void 0;
//JSON compatible struct returned from get_contract_state
class ContractParams {
    constructor() {
        this.accounts_registered = 0;
        this.owner_id = "";
        this.token_contract = "cheddar.token";
        // This value comes from the contract with (metadata.decimals - 5) decimals
        this.farming_rate = 10n; //yoctoCheddar per day per NEAR
        this.is_active = false;
        this.farming_start = 0; //unix timestamp
        this.farming_end = 0; //unix timestamp
        this.total_farmed = "0"; //yoctoCheddar
        this.total_staked = "0"; //yoctoNEAR
        // total_stake is needed for p1 contracts. It should only work for initial setting. On poolParams will be used to set total_staked so there shouldn't be any code differences
        this.total_stake = "0";
        // total_rewards is needed for p1 contracts. It should only work for initial setting. On poolParams will be used to set total_farmed so there shouldn't be any code differences
        this.total_rewards = "0";
        this.fee_rate = 0;
        this.rewards_per_day = this.farming_rate * 60n * 24n;
    }
    getRewardsPerDay() {
        return this.farming_rate * 60n * 24n;
    }
}
exports.ContractParams = ContractParams;
class TokenParams {
    constructor() {
        this.decimals = "24";
        this.icon = "";
        this.name = "";
        this.reference = "";
        this.reference_hash = "";
        this.spec = "";
        this.symbol = "";
    }
}
exports.TokenParams = TokenParams;
