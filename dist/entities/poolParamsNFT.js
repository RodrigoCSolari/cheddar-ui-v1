"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolParamsNFT = void 0;
const multipleCall_1 = require("../contracts/multipleCall");
const NFTContract_1 = require("../contracts/NFTContract");
const conversions_1 = require("../util/conversions");
const PoolEntitiesNFT_1 = require("./PoolEntitiesNFT");
const poolParams_1 = require("./poolParams");
class PoolParamsNFT {
    constructor(wallet, farmData, nftContract, nftBaseUrlForBoosting) {
        // stakeTokenContractList: TokenContractData[] = [];
        // stakeNFTContractList: NFTContractData[] = [];
        this.farmTokenContractList = [];
        this.wallet = wallet;
        this.type = farmData.poolType;
        this.poolDescription = farmData.description;
        this.descriptionLink = farmData.descriptionLink;
        this.config = farmData.config ? farmData.config : [];
        this.html = new poolParams_1.HtmlPoolParams(farmData.poolName);
        this.stakingContractData = new PoolEntitiesNFT_1.StakingContractDataNFT(wallet, farmData.contractName, farmData.nftBaseUrl);
        // console.log("DContract", nftContract)
        this.nftContractForBoosting = new NFTContract_1.NFTContract(nftContract, nftBaseUrlForBoosting);
        this.nftContractForBoosting.wallet = this.wallet;
    }
    async userHasStakedTokens() {
        const poolUserStatus = await this.stakingContractData.getUserStatus();
        let hasStakedTokens = false;
        for (let i = 0; i < poolUserStatus.stake_tokens.length; i++) {
            hasStakedTokens || (hasStakedTokens = poolUserStatus.stake_tokens[i].some(token => token.length > 0));
        }
        return hasStakedTokens;
    }
    async getPoolName() {
        return this.html.formId;
    }
    async setAllExtraData() {
    }
    async refreshAllExtraData() {
    }
    async withdrawBoost() {
        const poolUserStatus = await this.stakingContractData.getUserStatus();
        const tokenId = poolUserStatus.boost_nfts.split("@")[1];
        return this.stakingContractData.contract.unstake(this.nftContractForBoosting.contractId, tokenId);
    }
    async transferCheddar() {
        const contractParams = await this.stakingContractData.getContractParams();
        const cheddarContract = (await this.stakingContractData.getStakeTokenContractList())[0].contract;
        const amount = contractParams.cheddar_rate;
        const promise = cheddarContract.ft_transfer_call_without_send(this.stakingContractData.contract.contractId, amount, "cheddar stake" // required like this from staking contract
        );
        const promiseWithContract = {
            promise,
            contractName: cheddarContract.contractId
        };
        return promiseWithContract;
    }
    transferNFT(stakeNFTContract, contractId, tokenId) {
        const promise = stakeNFTContract.contract.nft_transfer_call_without_send(this.stakingContractData.contract.contractId, tokenId);
        const promiseWithContract = {
            promise,
            contractName: contractId
        };
        return promiseWithContract;
    }
    async stakeUnstakeNFTs(stakeUnstakeNFTsMap) {
        let TXs = [];
        for (let [contractId, stakeUnstakeNFTs] of stakeUnstakeNFTsMap) {
            const stakeNFTContractList = await this.stakingContractData.getStakeNFTContractList();
            // FIX This implementation is taking into consideration only one stake NFT by pool, but it should be done to consider many
            const stakeNFTContract = stakeNFTContractList.find(a => a.contract.contractId == contractId);
            for (let i = 0; i < stakeUnstakeNFTs.nftsToStake.length; i++) {
                TXs.push(await this.transferCheddar());
                const tokenId = stakeUnstakeNFTs.nftsToStake[i];
                TXs.push(this.transferNFT(stakeNFTContract, contractId, tokenId));
            }
            for (let i = 0; i < stakeUnstakeNFTs.nftsToUnstake.length; i++) {
                const tokenId = stakeUnstakeNFTs.nftsToUnstake[i];
                const promise = this.stakingContractData.contract.unstake_without_send(contractId, tokenId);
                const promiseWithContract = {
                    promise,
                    contractName: this.stakingContractData.contract.contractId
                };
                TXs.push(promiseWithContract);
            }
        }
        if (TXs.length > 0)
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
exports.PoolParamsNFT = PoolParamsNFT;
