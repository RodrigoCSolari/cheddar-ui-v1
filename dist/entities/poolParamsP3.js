"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolParamsP3 = exports.PoolUserStatus = exports.HtmlPoolParams = void 0;
const multipleCall_1 = require("../contracts/multipleCall");
const NFTContract_1 = require("../contracts/NFTContract");
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
class PoolUserStatus {
    constructor(stakedTokensLength, farmedTokensLength) {
        // All the numbers that are bigint are expected to be without any decimal points, and are converted when needed
        this.staked = [];
        this.farmedUnits = "0";
        this.farmed = [];
        // computed holds an integer number with no decimal places holding the info about the computed cheddar rewars calculated
        this.previous_timestamp = 0;
        this.tokenDecimals = 0;
        this.accName = '';
        this.cheddy_nft = '';
        this.staked = new Array(stakedTokensLength).fill("0");
        this.farmed = new Array(farmedTokensLength).fill("0");
    }
    getDisplayableAccountName() {
        return this.accName.length > 22 ? this.accName.slice(0, 10) + ".." + this.accName.slice(-10) : this.accName;
    }
    addStaked(amountArray) {
        for (let i = 0; i < amountArray.length; i++) {
            this.staked[i] = (BigInt(this.staked[i]) + amountArray[i]).toString();
        }
    }
}
exports.PoolUserStatus = PoolUserStatus;
class PoolParamsP3 {
    constructor(wallet, farmData, nftContract, nftBaseUrl) {
        this.stakeTokenContractList = [];
        this.farmTokenContractList = [];
        this.wallet = wallet;
        this.type = farmData.poolType;
        this.config = farmData.config ? farmData.config : [];
        this.poolDescription = farmData.description;
        this.descriptionLink = farmData.descriptionLink;
        this.html = new HtmlPoolParams(farmData.poolName);
        this.stakingContractData = new PoolEntities_1.StakingContractDataP3(wallet, farmData.contractName);
        this.nftContractForBoosting = new NFTContract_1.NFTContract(nftContract, nftBaseUrl);
        this.nftContractForBoosting.wallet = this.wallet;
    }
    async userHasStakedTokens() {
        const poolUserStatus = await this.stakingContractData.getUserStatus();
        let hasStakedTokens = false;
        for (let i = 0; i < poolUserStatus.stake_tokens.length; i++) {
            hasStakedTokens || (hasStakedTokens = BigInt(poolUserStatus.stake_tokens[i]) > 0n);
        }
        return hasStakedTokens;
    }
    async getPoolName() {
        let tokenNames = [];
        const stakeTokenContractList = await this.stakingContractData.getStakeTokenContractList();
        // It was requested that cheddar goes last
        let hasCheddar = false;
        let cheddarSymbol;
        for (let i = 0; i < stakeTokenContractList.length; i++) {
            const tokenContractData = stakeTokenContractList[i];
            const tokenMetadata = await tokenContractData.getMetadata();
            const isCheddar = tokenMetadata.symbol.toUpperCase() == "CHEDDAR";
            hasCheddar = hasCheddar || isCheddar;
            if (!isCheddar) {
                tokenNames.push(tokenMetadata.symbol);
            }
            else {
                cheddarSymbol = tokenMetadata.symbol;
            }
        }
        if (hasCheddar) {
            tokenNames.push(cheddarSymbol);
        }
        const names = tokenNames.join(" + ");
        if (names.length > 20) {
            return names.substring(0, 7) + "..." + names.substring(names.length - 7);
        }
        else {
            return names;
        }
    }
    async setAllExtraData() {
    }
    async refreshAllExtraData() {
    }
    async stake(amounts) {
        let TXs = [];
        const stakeTokenContractList = await this.stakingContractData.getStakeTokenContractList();
        for (let i = 0; i < stakeTokenContractList.length; i++) {
            const stakeTokenContract = stakeTokenContractList[i].contract;
            if (amounts[i] != 0n) {
                const promise = stakeTokenContract.ft_transfer_call_without_send(this.stakingContractData.contract.contractId, amounts[i].toString());
                const promiseWithContract = {
                    promise,
                    contractName: stakeTokenContract.contractId
                };
                TXs.push(promiseWithContract);
            }
        }
        await (0, multipleCall_1.callMulipleTransactions)(TXs, this.stakingContractData.contract);
    }
    async unstake(amounts) {
        let TXs = [];
        const stakeTokenContractList = await this.stakingContractData.getStakeTokenContractList();
        for (let i = 0; i < stakeTokenContractList.length; i++) {
            if (amounts[i] != 0n) {
                const stakeContract = stakeTokenContractList[i].contract;
                const promise = stakeContract.unstake_without_send(stakeContract.contractId, amounts[i].toString());
                const promiseWithContract = {
                    promise,
                    contractName: this.stakingContractData.contract.contractId
                };
                TXs.push(promiseWithContract);
            }
        }
        await (0, multipleCall_1.callMulipleTransactions)(TXs, this.stakingContractData.contract);
    }
    async getStakeTokensDetail() {
        let dataArray = [];
        const contractParams = await this.stakingContractData.getContractParams();
        const stakeTokenContractList = await this.stakingContractData.getStakeTokenContractList();
        for (let i = 0; i < stakeTokenContractList.length; i++) {
            const stakeTokenContract = stakeTokenContractList[i];
            const iconData = await this.getIcon(stakeTokenContract);
            const stakeTokenMetadata = await stakeTokenContract.getMetadata();
            const totalStaked = (0, conversions_1.convertToDecimals)(contractParams.total_staked[i], stakeTokenMetadata.decimals, 5);
            dataArray.push({
                iconData,
                content: totalStaked
            });
        }
        return dataArray;
    }
    async getRewardsTokenDetail() {
        let dataArray = [];
        const contractParams = await this.stakingContractData.getContractParams();
        const poolUserStatus = await this.stakingContractData.getUserStatus();
        const farmTokenContractList = await this.stakingContractData.getFarmTokenContractList();
        for (let i = 0; i < farmTokenContractList.length; i++) {
            const farmTokenContract = farmTokenContractList[i];
            const iconData = await this.getIcon(farmTokenContract);
            const farmTokenMetadata = await farmTokenContract.getMetadata();
            const tokenName = farmTokenMetadata.name;
            // const rewardsPerDayBN = BigInt(contractParams.farm_token_rates[i]) * 60n * 24n
            const rewardsPerDayBN = BigInt(contractParams.farm_unit_emission) * BigInt(contractParams.farm_token_rates[i]) * 60n * 24n / (BigInt(10) ** BigInt(24));
            const rewardsPerDay = (0, conversions_1.convertToDecimals)(rewardsPerDayBN, farmTokenMetadata.decimals, 5);
            const totalRewards = (0, conversions_1.convertToDecimals)(contractParams.total_farmed[i], farmTokenMetadata.decimals, 5);
            const userUnclaimedRewards = (0, conversions_1.convertToDecimals)(poolUserStatus.farmed_tokens[i], farmTokenMetadata.decimals, 5);
            dataArray.push({
                iconData,
                tokenName,
                rewardsPerDayBN,
                rewardsPerDay,
                totalRewards,
                userUnclaimedRewards,
            });
        }
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
    async getRewardTokenIconData() {
        let dataArray = [];
        const farmTokenContractList = await this.stakingContractData.getFarmTokenContractList();
        for (let i = 0; i < farmTokenContractList.length; i++) {
            const farmTokenContract = farmTokenContractList[i];
            const farmTokenMetadata = await farmTokenContract.getMetadata();
            const src = farmTokenMetadata.icon ? farmTokenMetadata.icon : farmTokenMetadata.name;
            const data = {
                isSvg: src.includes("<svg"),
                src: src,
                tokenName: farmTokenMetadata.name ? farmTokenMetadata.name : "NoName"
            };
            dataArray.push(data);
        }
        return dataArray;
    }
    async getWalletAvailable() {
        let walletAvailable = [];
        const stakeTokenContractList = await this.stakingContractData.getStakeTokenContractList();
        for (let i = 0; i < stakeTokenContractList.length; i++) {
            const contractData = stakeTokenContractList[i];
            const balance = await contractData.getBalance();
            walletAvailable.push(balance);
        }
        return walletAvailable;
    }
}
exports.PoolParamsP3 = PoolParamsP3;
