"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenDataArray = exports.getTokenData = void 0;
const config_1 = require("../config");
let tokenDataArray;
let testTokensSymbols = ["afi-tt", "gua"];
async function setAllTokensData() {
    const url = "https://api.stats.ref.finance/api/top-tokens";
    const response = await fetch(url);
    const errorMessage = "We are experiencing issues with the Ref Price Oracle, please try again in a bit.";
    const json = await response.json();
    tokenDataArray = json;
}
async function getTokenData(token, reloadData = false) {
    if (!tokenDataArray || reloadData)
        await setAllTokensData();
    return getPriceWithData(token);
}
exports.getTokenData = getTokenData;
function getPriceWithData(tokenSymbol) {
    tokenSymbol = tokenSymbol.toLowerCase();
    //@ts-ignore
    if (config_1.ENV == "testnet" && testTokensSymbols.includes(tokenSymbol)) {
        // AFI-TT doesn't exists in mainnet so this is a patch for testing purposes, selecting the token
        // PEM arbitrarily
        tokenSymbol = "pem".toLowerCase();
    }
    if (tokenSymbol == "near" || tokenSymbol == "nearcon") {
        tokenSymbol = "wnear";
    }
    let output = undefined;
    tokenDataArray.forEach(tokenData => {
        if (tokenData.symbol.toLowerCase() === tokenSymbol) {
            output = tokenData;
        }
    });
    if (output !== undefined) {
        return output;
    }
    throw Error(`Token with symbol ${tokenSymbol} not found`);
}
async function getTokenDataArray(tokenArray, reloadData = false) {
    if (!tokenDataArray || reloadData)
        await setAllTokensData();
    // const allTokenData = await setAllTokensData()
    let output = new Map();
    tokenArray.forEach(tokenSymbol => {
        tokenSymbol = tokenSymbol.toLowerCase();
        output.set(tokenSymbol, getPriceWithData(tokenSymbol));
    });
    return output;
}
exports.getTokenDataArray = getTokenDataArray;
