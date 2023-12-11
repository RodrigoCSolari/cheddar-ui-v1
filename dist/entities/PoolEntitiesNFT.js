"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTContractData = exports.StakingContractDataNFT = void 0;
const NFTContract_1 = require("../contracts/NFTContract");
const PoolEntities_1 = require("./PoolEntities");
const nft_staking_1 = require("../contracts/nft-staking");
const p3_structures_1 = require("../contracts/p3-structures");
async function getNFTContractList(wallet, contractNameArray, nftBaseUrl) {
    let NFTContractList = [];
    for (let i = 0; i < contractNameArray.length; i++) {
        const NFTContractName = contractNameArray[i];
        NFTContractList.push(new NFTContractData(wallet, NFTContractName, nftBaseUrl[i], ""));
    }
    return NFTContractList;
}
class StakingContractDataNFT {
    constructor(wallet, contractId, nftBaseUrl) {
        this.stakeTokenContractList = [];
        this.stakeNFTContractList = [];
        this.farmTokenContractList = [];
        this.contract = new nft_staking_1.StakingPoolNFT(contractId);
        this.contract.wallet = wallet;
        this.nftBaseUrl = nftBaseUrl;
        this.refreshData();
        this.stakeTokenContractListPromise = this.getStakeTokenContractListPromise();
        this.stakeNFTContractListPromise = this.getStakeNFTContractListPromise(nftBaseUrl);
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
                this.userStatus = new p3_structures_1.PoolUserStatusP3NFT(contractParams.stake_tokens.length, contractParams.farm_tokens.length);
            }
        }
        return this.userStatus;
    }
    async getStakeTokenContractListPromise() {
        const contractParams = await this.getContractParams();
        // On NFT staking contract, cheddar is always the staked token, besides the NFT's
        return (0, PoolEntities_1.getTokenContractList)(this.contract.wallet, [contractParams.cheddar]);
    }
    async getStakeNFTContractListPromise(nftBaseUrl) {
        const contractParams = await this.getContractParams();
        // On NFT staking contract, cheddar is always the staked token, besides the NFT's
        return getNFTContractList(this.contract.wallet, contractParams.stake_tokens, nftBaseUrl);
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
            this.farmTokenContractList = await (0, PoolEntities_1.getTokenContractList)(this.contract.wallet, contractParams.farm_tokens);
        }
        return this.farmTokenContractList;
    }
    async getStakeNFTContractList() {
        if (this.stakeNFTContractList.length == 0) {
            this.stakeNFTContractList = await this.stakeNFTContractListPromise;
            // const contractParams = await this.getContractParams();
            // this.stakeTokenContractList = await getTokenContractList(this.contract.wallet, contractParams.stake_tokens)
        }
        return this.stakeNFTContractList;
    }
}
exports.StakingContractDataNFT = StakingContractDataNFT;
class NFTContractData {
    constructor(wallet, contractId, nftBaseUrl, poolName = "") {
        this.wallet = wallet;
        this.contract = new NFTContract_1.NFTContract(contractId, nftBaseUrl);
        this.contract.wallet = wallet;
        if (this.wallet.isConnected()) {
            this.tokensForOwnerPromise = this.contract.nft_tokens_for_owner(wallet.getAccountId());
            this.metadata = this.contract.nft_metadata();
        }
        // this.balancePromise = this.contract.ft_balance_of(wallet.getAccountId())
    }
    async getTokensForOwner() {
        if (!this.tokensForOwner) {
            this.tokensForOwner = await this.tokensForOwnerPromise;
        }
        return this.tokensForOwner;
    }
    getTokensForOwnerSync() {
        return this.tokensForOwner;
    }
    refreshData() {
        this.tokensForOwner = undefined;
        this.tokensForOwnerPromise = this.contract.nft_tokens_for_owner(this.wallet.getAccountId());
    }
    async getMetadata() {
        if (!this.metadata) {
            this.metadata = this.contract.nft_metadata();
        }
        return this.metadata;
    }
}
exports.NFTContractData = NFTContractData;
