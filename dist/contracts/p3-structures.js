"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferTokenData = exports.TokenParams = exports.PoolUserStatusP3NFT = exports.PoolUserStatusP3 = exports.P3ContractParams = void 0;
//JSON compatible struct returned from get_contract_state
class P3ContractParams {
    constructor() {
        this.owner_id = "";
        this.stake_tokens = [];
        this.stake_rates = [];
        this.farm_unit_emission = "";
        this.farm_tokens = [];
        this.farm_token_rates = [];
        this.is_active = false;
        this.farming_start = 0;
        this.farming_end = 0;
        this.total_staked = [];
        this.total_farmed = [];
        this.fee_rate = 0;
        this.accounts_registered = 0;
        // this.rewards_per_day = this.farming_rate * 60n * 24n
    }
}
exports.P3ContractParams = P3ContractParams;
class PoolUserStatusP3 {
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
        this.stake_tokens = new Array(stakeTokensLength).fill("0");
        this.farmed_tokens = new Array(farmTokensLength).fill("0");
    }
}
exports.PoolUserStatusP3 = PoolUserStatusP3;
class PoolUserStatusP3NFT {
    // This constructor should only be used when user is not registered, hence userStatus is null
    constructor(stakeTokensLength = 0, farmTokensLength = 0) {
        // Amount of each token staked by user
        this.stake_tokens = [];
        this.stake = "";
        this.farmed_units = "";
        // Amount of each token in farm, waiting to be harvested
        this.farmed_tokens = [];
        this.boost_nfts = "";
        this.timestamp = 0;
        this.stake_tokens = new Array(stakeTokensLength).fill([]);
        this.farmed_tokens = new Array(farmTokensLength).fill("0");
    }
}
exports.PoolUserStatusP3NFT = PoolUserStatusP3NFT;
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
