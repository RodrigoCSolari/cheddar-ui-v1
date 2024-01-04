"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolParams = exports.UserStatusP2 = exports.HtmlPoolParams = void 0;
const NEP141_1 = require("../contracts/NEP141");
const conversions_1 = require("../util/conversions");
const PoolEntities_1 = require("./PoolEntities");
//JSON compatible struct returned from get_contract_state
class HtmlPoolParams {
    constructor(id) {
        this.id = id + "-container";
        this.formId = id;
    }
}
exports.HtmlPoolParams = HtmlPoolParams;
class UserStatusP2 {
    constructor(userStatus) {
        // All the numbers that are bigint are expected to be without any decimal points, and are converted when needed
        this.real_rewards_per_day = 0n;
        this.skip = 0;
        this.staked = 0n;
        this.real = 0n;
        // computed holds an integer number with no decimal places holding the info about the computed cheddar rewars calculated
        this.computed = 0n;
        this.previous_real = 0n;
        this.previousTimestamp = 0;
        this.tokenDecimals = 0;
        this.accName = '';
        if (userStatus) {
            this.staked = BigInt(userStatus[0]);
            this.real = BigInt(userStatus[1]);
            this.previousTimestamp = Number(userStatus[2]);
        }
    }
    hasStakedTokens() {
        return this.staked > 0n;
    }
    getDisplayableComputed() {
        return (0, conversions_1.convertToDecimals)(this.computed.toString(), 24, 7);
    }
    getCurrentCheddarRewards() {
        return (0, conversions_1.convertToDecimals)(this.real.toString(), 24, 7);
    }
    getCurrentDisplayableCheddarRewards() {
        return (0, conversions_1.convertToDecimals)(this.computed.toString(), 24, 7);
    }
    getDisplayableAccountName() {
        return this.accName.length > 22 ? this.accName.slice(0, 10) + ".." + this.accName.slice(-10) : this.accName;
    }
    addStaked(amount) {
        this.staked = this.staked + BigInt(amount);
    }
}
exports.UserStatusP2 = UserStatusP2;
class PoolParams {
    constructor(wallet, farmData, cheddarContractId) {
        this.stakeTokenContractList = [];
        this.farmTokenContractList = [];
        this.wallet = wallet;
        this.type = farmData.poolType;
        this.html = new HtmlPoolParams(farmData.poolName);
        this.poolName = farmData.poolName;
        this.config = farmData.config ? farmData.config : [];
        this.poolDescription = farmData.description;
        this.descriptionLink = farmData.descriptionLink;
        this.stakingContractData = new PoolEntities_1.StakingContractDataP2(wallet, farmData.contractName, farmData.tokenContractName, farmData.poolName);
        this.stakingContractData.contract;
        this.cheddarContract = new NEP141_1.NEP141Trait(cheddarContractId);
        this.stakeTokenContract = new NEP141_1.NEP141Trait(farmData.tokenContractName);
        this.stakeTokenMetaData = {};
        this.cheddarContract.wallet = wallet;
        this.stakeTokenContract.wallet = wallet;
    }
    async userHasStakedTokens() {
        const poolUserStatus = await this.stakingContractData.getUserStatus();
        return Number(poolUserStatus.staked) > 0;
    }
    async getTokenContractList(tokenContractName) {
        return [new PoolEntities_1.TokenContractData(this.wallet, tokenContractName, this.poolName)];
    }
    async getPoolName() {
        /* Normally, pool names come from metadata, but in case it is requested a particular poolname
        you have to set on config.ts the poolName param starting with _ */
        if (this.poolName[0] === "_")
            return this.poolName.substring(1);
        const metadata = await this.stakeTokenContractList[0].getMetadata();
        return metadata.symbol;
    }
    async setStakeTokenContractList() {
        this.stakeTokenContractList = [await this.getStakeTokenContractData()];
    }
    async setFarmTokenContractList() {
        this.farmTokenContractList = await this.getTokenContractList(this.cheddarContract.contractId);
    }
    async setAllExtraData() {
        await this.setStakeTokenContractList();
        await this.setFarmTokenContractList();
    }
    async refreshAllExtraData() {
    }
    async getRewardTokenIconData() {
        const cheddarMetaData = await this.cheddarContract.ft_metadata();
        const src = cheddarMetaData.icon ? cheddarMetaData.icon : cheddarMetaData.name;
        return [{
                isSvg: src.includes("<svg"),
                src: src,
                tokenName: cheddarMetaData.name
            }];
    }
    async getStakeTokensDetail() {
        let dataArray = [];
        const stakeTokenContractData = (await this.stakingContractData.getStakeTokenContractList())[0];
        const iconData = await this.getIcon(stakeTokenContractData);
        const contractParams = await this.stakingContractData.getContractParams();
        const metadata = await stakeTokenContractData.getMetadata();
        const totalStaked = (0, conversions_1.convertToDecimals)(contractParams.total_staked, metadata.decimals, 5);
        dataArray.push({
            iconData,
            content: totalStaked
        });
        return dataArray;
    }
    async getRewardsTokenDetail() {
        let dataArray = [];
        const contractParams = await this.stakingContractData.getContractParams();
        const poolUserStatus = await this.stakingContractData.getUserStatus();
        const farmTokenContract = this.farmTokenContractList[0];
        const iconData = await this.getIcon(farmTokenContract);
        const farmTokenMetadata = await farmTokenContract.getMetadata();
        const tokenName = farmTokenMetadata.name;
        const rewardsPerDayBN = BigInt(contractParams.farming_rate) * 60n * 24n;
        const rewardsPerDay = (0, conversions_1.convertToDecimals)(rewardsPerDayBN, farmTokenMetadata.decimals, 7);
        const totalRewards = (0, conversions_1.convertToDecimals)(contractParams.total_farmed, farmTokenMetadata.decimals, 7);
        const userUnclaimedRewards = (0, conversions_1.convertToDecimals)(poolUserStatus.real.toString(), farmTokenMetadata.decimals, 7);
        dataArray.push({
            iconData,
            tokenName,
            rewardsPerDay,
            totalRewards,
            userUnclaimedRewards,
        });
        return dataArray;
    }
    async getIcon(contractData) {
        const metadata = await contractData.getMetadata();
        const src = metadata.icon ? metadata.icon : metadata.name;
        return {
            isSvg: src.includes("<svg"),
            src: src,
            tokenName: metadata.name ? metadata.name : "NoName"
        };
    }
    async getStakeTokenContractData() {
        return new PoolEntities_1.TokenContractData(this.wallet, this.stakeTokenContract.contractId, this.poolName);
    }
    async getFarmTokenContractData() {
        return new PoolEntities_1.TokenContractData(this.wallet, this.cheddarContract.contractId);
    }
    async getWalletAvailable() {
        return await this.stakeTokenContract.ft_balance_of(this.wallet.getAccountId());
    }
}
exports.PoolParams = PoolParams;
