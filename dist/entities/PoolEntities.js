"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenContractData = exports.StakingContractDataP2 = exports.StakingContractDataP3 = exports.getTokenContractList = void 0;
const config_1 = require("../config");
const nearHardcodedObjects_1 = require("../contracts/nearHardcodedObjects");
const NEP141_1 = require("../contracts/NEP141");
const p2_staking_1 = require("../contracts/p2-staking");
const p3_staking_1 = require("../contracts/p3-staking");
const p3_structures_1 = require("../contracts/p3-structures");
const disconnected_wallet_1 = require("../wallet-api/disconnected-wallet");
const poolParams_1 = require("./poolParams");
async function getTokenContractList(wallet, contractNameArray) {
    let tokenContractList = [];
    for (let i = 0; i < contractNameArray.length; i++) {
        const tokenContractName = contractNameArray[i];
        tokenContractList.push(new TokenContractData(wallet, tokenContractName, ""));
    }
    return tokenContractList;
}
exports.getTokenContractList = getTokenContractList;
class StakingContractDataP3 {
    constructor(wallet, contractId) {
        this.stakeTokenContractList = [];
        this.farmTokenContractList = [];
        this.contract = new p3_staking_1.StakingPoolP3(contractId);
        this.contract.wallet = wallet;
        this.refreshData();
        this.stakeTokenContractListPromise = this.getStakeTokenContractListPromise();
    }
    refreshData() {
        this.contractParamsPromise = this.contract.get_contract_params();
        if (this.contract.wallet.isConnected()) {
            this.userStatusPromise = this.contract.status();
        }
        this.contractParams = undefined;
        this.userStatus = undefined;
    }
    async getContractParams() {
        if (this.contractParams === undefined) {
            this.contractParams = await this.contractParamsPromise;
        }
        return this.contractParams;
    }
    getContractParamsNotAsync() {
        return this.contractParams;
    }
    async getUserStatus() {
        if (this.userStatus === undefined) {
            this.userStatus = await this.userStatusPromise;
            if (this.userStatus == null) { // When user is not registered, user status is null
                const contractParams = await this.getContractParams();
                this.userStatus = new p3_structures_1.PoolUserStatusP3(contractParams.stake_tokens.length, contractParams.farm_tokens.length);
            }
        }
        return this.userStatus;
    }
    async getStakeTokenContractListPromise() {
        const contractParams = await this.getContractParams();
        return getTokenContractList(this.contract.wallet, contractParams.stake_tokens);
    }
    async getStakeTokenContractList() {
        if (this.stakeTokenContractList.length == 0) {
            this.stakeTokenContractList = await this.stakeTokenContractListPromise;
            // const contractParams = await this.getContractParams();
            // this.stakeTokenContractList = await getTokenContractList(this.contract.wallet, contractParams.stake_tokens)
        }
        return this.stakeTokenContractList;
    }
    async getFarmTokenContractList() {
        if (this.farmTokenContractList.length == 0) {
            const contractParams = await this.getContractParams();
            this.farmTokenContractList = await getTokenContractList(this.contract.wallet, contractParams.farm_tokens);
        }
        return this.farmTokenContractList;
    }
}
exports.StakingContractDataP3 = StakingContractDataP3;
class StakingContractDataP2 {
    constructor(wallet, contractId, stakeTokenContractId, poolName) {
        this.contract = new p2_staking_1.StakingPoolP1(contractId);
        this.contract.wallet = wallet;
        this.refreshData();
        this.stakeTokenContractList = [new TokenContractData(wallet, stakeTokenContractId, poolName)];
    }
    refreshData() {
        this.contractParamsPromise = this.contract.get_contract_params();
        this.userStatusPromise = this.contract.status();
        this.contractParams = undefined;
        this.userStatus = undefined;
    }
    async getContractParams() {
        if (this.contractParams === undefined) {
            this.contractParams = await this.contractParamsPromise;
        }
        if (this.contractParams.total_staked === undefined) {
            // p1 contracts have the parameter total_stake, while p2 contracts have total_staked. So this is a patch for avoiding changing code
            this.contractParams.total_staked = this.contractParams.total_stake;
            this.contractParams.farming_rate = this.contractParams.rewards_per_day;
            this.contractParams.total_farmed = this.contractParams.total_rewards;
        }
        return this.contractParams;
    }
    getContractParamsNotAsync() {
        return this.contractParams;
    }
    async getUserStatus() {
        if (this.contract.wallet == disconnected_wallet_1.disconnectedWallet) {
            this.userStatus = new poolParams_1.UserStatusP2();
        }
        else if (this.userStatus === undefined) {
            const userStatus = await this.userStatusPromise;
            this.userStatus = new poolParams_1.UserStatusP2(userStatus);
        }
        return this.userStatus;
    }
    // This method is async so it matches with P3, since in that case, the stake tokens come from contract
    async getStakeTokenContractList() {
        return this.stakeTokenContractList;
    }
}
exports.StakingContractDataP2 = StakingContractDataP2;
class TokenContractData {
    constructor(wallet, contractId, poolName = "") {
        this.wallet = wallet;
        if (contractId !== config_1.NO_CONTRACT_DEPOSIT_NEAR) {
            this.contract = new NEP141_1.NEP141Trait(contractId);
            this.contract.wallet = wallet;
            this.metaDataPromise = this.contract.ft_metadata();
            // TODO Dani check if user is logged
            if (wallet.isConnected())
                this.balancePromise = this.contract.ft_balance_of(wallet.getAccountId());
        }
        else {
            this.metaData = (0, nearHardcodedObjects_1.getNearMetadata)(poolName);
            this.balancePromise = wallet.getAccountBalance();
        }
    }
    async getMetadata() {
        if (!this.metaData) {
            this.metaData = await this.metaDataPromise;
            if (this.metaData.symbol.includes("$")) { // Meta symbol is $META, and this is bad for html selectors
                this.metaData.symbolForHtml = this.metaData.symbol.replace("$", "");
            }
            else {
                this.metaData.symbolForHtml = this.metaData.symbol;
            }
        }
        return this.metaData;
    }
    getMetadataSync() {
        return this.metaData;
    }
    async getBalance() {
        if (this.contract?.wallet == disconnected_wallet_1.disconnectedWallet) {
            this.balance = "0";
        }
        else if (!this.balance) {
            this.balance = await this.balancePromise;
        }
        return this.balance;
    }
    getBalanceSync() {
        // If you get an undefined error, then you either need to use await getBalance() or await Promise.all(list.map(elem => elem.getBalance()))
        return this.balance;
    }
    refreshData() {
        this.balance = undefined;
        if (this.contract) {
            this.balancePromise = this.contract.ft_balance_of(this.wallet.getAccountId());
        }
        else {
            this.balancePromise = this.wallet.getAccountBalance();
        }
    }
}
exports.TokenContractData = TokenContractData;
