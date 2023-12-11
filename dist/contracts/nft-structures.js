"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferTokenData = exports.TokenParams = exports.NFTStakingPoolUserStatus = exports.NFTStakingContractParams = void 0;
//JSON compatible struct returned from get_contract_state
class NFTStakingContractParams {
    constructor() {
        this.is_active = false;
        this.owner_id = "";
        this.stake_tokens = [];
        this.stake_rates = [];
        this.farm_unit_emission = "";
        this.farm_tokens = [];
        this.farm_token_rates = [];
        this.farm_deposits = [];
        this.farming_start = 0;
        this.farming_end = 0;
        this.cheddar_nft = "";
        this.total_staked = [];
        this.total_farmed = [];
        this.fee_rate = 0;
        this.accounts_registered = 0;
        this.cheddar_rate = "";
        this.cheddar = "";
        // this.rewards_per_day = this.farming_rate * 60n * 24n
    }
}
exports.NFTStakingContractParams = NFTStakingContractParams;
class NFTStakingPoolUserStatus {
    // This constructor should only be used when user is not registered, hence userStatus is null
    constructor(stakeTokensLength = 0, farmTokensLength = 0) {
        // Amount of each token staked by user
        this.stake_tokens = [];
        this.stake = "";
        this.farmed_units = "";
        // Amount of each token in farm, waiting to be harvested
        this.farmed_tokens = [];
        this.cheddy_nft = "";
        this.timestamp = 0;
        this.total_cheddar_staked = "";
        this.stake_tokens = new Array(stakeTokensLength).fill("");
        this.farmed_tokens = new Array(stakeTokensLength).fill("");
    }
}
exports.NFTStakingPoolUserStatus = NFTStakingPoolUserStatus;
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
class TransferTokenData {
    constructor(contractName, amount) {
        this.contractName = contractName;
        this.amount = amount;
    }
}
exports.TransferTokenData = TransferTokenData;
