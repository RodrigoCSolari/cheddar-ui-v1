"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolList = void 0;
const __1 = require("..");
const NEP141_1 = require("../contracts/NEP141");
const p2_staking_1 = require("../contracts/p2-staking");
const poolParams_1 = require("../entities/poolParams");
const poolParamsNFT_1 = require("./poolParamsNFT");
const poolParamsP3_1 = require("./poolParamsP3");
let poolList;
async function generatePoolList(wallet) {
    poolList = [];
    let size = __1.nearConfig.farms.length;
    for (let i = 0; i < size; i++) {
        const index = __1.nearConfig.farms[i].index;
        const type = __1.nearConfig.farms[i].poolType;
        const poolHtml = new poolParams_1.HtmlPoolParams(__1.nearConfig.farms[i].poolName);
        const cheddarContractName = new NEP141_1.NEP141Trait(__1.nearConfig.cheddarContractName);
        const tokenContractName = new NEP141_1.NEP141Trait(__1.nearConfig.farms[i].tokenContractName);
        let contract;
        let poolParams;
        if (__1.nearConfig.farms[i].poolType == "multiple") {
            // contract = new StakingPoolP3(nearConfig.farms[i].contractName);
            // poolParams = new PoolParamsP3(index, type, poolHtml, contract, cheddarContractName, nearConfig.nftContractAddress, wallet);
            poolParams = new poolParamsP3_1.PoolParamsP3(wallet, __1.nearConfig.farms[i], __1.nearConfig.nftContractAddress, __1.nearConfig.cheddarNFTBaseUrl);
        }
        else if (__1.nearConfig.farms[i].poolType == "single") {
            contract = new p2_staking_1.StakingPoolP1(__1.nearConfig.farms[i].contractName);
            poolParams = new poolParams_1.PoolParams(wallet, __1.nearConfig.farms[i], __1.nearConfig.cheddarContractName);
            // poolParams = new PoolParams(index, type, poolHtml, contract, cheddarContractName, tokenContractName, new PoolResultParams(), wallet, nearConfig.farms[i].poolName);
        }
        else if (__1.nearConfig.farms[i].poolType == "nft") {
            contract = new p2_staking_1.StakingPoolP1(__1.nearConfig.farms[i].contractName);
            poolParams = new poolParamsNFT_1.PoolParamsNFT(wallet, __1.nearConfig.farms[i], __1.nearConfig.cheddarNFTContractName, __1.nearConfig.cheddarNFTBaseUrl);
        }
        else {
            continue;
        }
        await poolParams.setAllExtraData();
        poolList.push(poolParams);
    }
}
async function getPoolList(wallet) {
    if (!poolList || poolList.length == 0) {
        await generatePoolList(wallet);
        await Promise.all(poolList.map(async function (pool) {
            return await pool.stakingContractData.getContractParams();
        }));
        poolList = poolList.sort((a, b) => b.stakingContractData.getContractParamsNotAsync().farming_end - a.stakingContractData.getContractParamsNotAsync().farming_end);
    }
    return poolList;
}
exports.getPoolList = getPoolList;
