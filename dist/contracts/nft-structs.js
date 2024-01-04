"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newNFT = void 0;
function newNFT(tokenId, baseUrl, contractId) {
    return {
        contract_id: contractId,
        base_url: baseUrl,
        token_id: tokenId,
        owner_id: "",
        metadata: {
            title: "",
            description: "",
            media: tokenId + ".png",
            media_hash: "",
            copies: null,
            issued_at: "",
            expires_at: "",
            starts_at: "",
            updated_at: "",
            extra: "",
            reference: "",
            reference_hash: ""
        },
        approved_account_ids: {}
    };
}
exports.newNFT = newNFT;
