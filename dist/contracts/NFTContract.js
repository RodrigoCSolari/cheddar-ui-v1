"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTContract = void 0;
//JSON compatible struct ft_metadata
const base_smart_contract_1 = require("../wallet-api/base-smart-contract");
const nearAPI = __importStar(require("near-api-js"));
const conversions_1 = require("../util/conversions");
const bn_js_1 = require("bn.js");
// export const nftBaseUrl = "https://nftstorage.link/ipfs/bafybeicoln5rvccttgypzo26irjlskslnfynkzig6bowpsj6ay45geeice/"
class NFTContract extends base_smart_contract_1.SmartContract {
    constructor(contractId, baseUrl) {
        super(contractId);
        this.contractId = contractId;
        this.baseUrl = baseUrl;
    }
    async nft_transfer_call(receiver_id, token_id) {
        return this.call("nft_transfer_call", { receiver_id: receiver_id, token_id: token_id, msg: "to boost" }, (0, conversions_1.TGas)(200), "1"); //one-yocto attached
    }
    async nft_transfer_call_without_send(receiver_id, token_id) {
        return nearAPI.transactions.functionCall("nft_transfer_call", {
            receiver_id,
            token_id,
            msg: "to farm"
        }, new bn_js_1.BN((0, conversions_1.TGas)(80)), new bn_js_1.BN(1));
    }
    async nft_tokens_for_owner(accountId) {
        return this.view("nft_tokens_for_owner", { account_id: accountId, from_index: "0", "limit": 9999 });
    }
    async nft_metadata() {
        return this.viewWithoutAccount("nft_metadata");
    }
    async nft_token(tokenId) {
        return this.viewWithoutAccount("nft_token", { token_id: tokenId });
    }
}
exports.NFTContract = NFTContract;
