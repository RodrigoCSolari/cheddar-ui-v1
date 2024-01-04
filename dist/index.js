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
exports.wallet = exports.near = exports.nearConfig = void 0;
const near_api_js_1 = require("near-api-js");
const config_1 = require("./config");
const disconnected_wallet_1 = require("./wallet-api/disconnected-wallet");
const near_web_wallet_1 = require("./wallet-api/near-web-wallet/near-web-wallet");
const narwallets_1 = require("./wallet-api/narwallets/narwallets");
const conversions_1 = require("./util/conversions");
//qs/qsa are shortcut for document.querySelector/All
const document_1 = require("./util/document");
const checkRedirectSearchParams_1 = require("./wallet-api/near-web-wallet/checkRedirectSearchParams");
const NEP141_1 = require("./contracts/NEP141");
const poolParams_1 = require("./entities/poolParams");
const poolList_1 = require("./entities/poolList");
const poolParamsP3_1 = require("./entities/poolParamsP3");
const nearAPI = __importStar(require("near-api-js"));
const oracle_1 = require("./util/oracle");
const nft_structs_1 = require("./contracts/nft-structs");
const bn_js_1 = require("bn.js");
const multipleCall_1 = require("./contracts/multipleCall");
const poolParamsNFT_1 = require("./entities/poolParamsNFT");
const liquidityButton_1 = require("./util/animations/liquidityButton");
const new_confetti_button_1 = require("./util/animations/new-confetti-button");
//get global config
//const nearConfig = getConfig(process.env.NODE_ENV || 'testnet')
exports.nearConfig = (0, config_1.getConfig)(config_1.ENV); //default testnet, can change according to URL on window.onload
// global variables used throughout
exports.wallet = disconnected_wallet_1.disconnectedWallet;
let nearWebWalletConnection;
let nearConnectedWalletAccount;
let accountName;
let isPaused = false;
let loggedWithNarwallets = false;
//time in ms
const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;
let countDownIntervalId;
const refreshTime = 60 * SECONDS;
const ONE_NEAR = BigInt(10) ** BigInt(24);
//------------------------------
//--- connect buttons->code ----
//------------------------------
//all popup "cancel" buttons
(0, document_1.qsa)('.popup button#cancel').forEach(f => f.onclick = (event) => { event.preventDefault(); (0, document_1.hideOverlay)(); });
//connect wallet selection boxes
// qs('#near-web-wallet-box').onclick = loginNearWebWallet
// qs('#narwallets-wallet-box').onclick = loginNarwallets
//nav my-account "home"
(0, document_1.qs)('nav #home').onclick =
    async function (event) {
        event.preventDefault();
        if (exports.wallet.isConnected()) {
            showSection("#home-connected");
            selectNav("#home");
        }
        else {
            signedOutFlow();
        }
    };
(0, document_1.qs)('#logo').onclick =
    async function (event) {
        event.preventDefault();
        if (exports.wallet.isConnected()) {
            signedInFlow(exports.wallet);
        }
        else {
            signedOutFlow();
        }
    };
(0, document_1.qs)('#my-account').onclick =
    async function (event) {
        event.preventDefault();
        if (exports.wallet.isConnected()) {
            console.log("Connected");
            signedInFlow(exports.wallet);
        }
        else {
            console.log("Disconnected");
            loginNearWebWallet();
        }
    };
let moreGamesButton = (0, document_1.qs)(".games-dropdown");
moreGamesButton.addEventListener("click", gamesDropdownHandler());
let noLivePoolsMsg = (0, document_1.qs)(".no-live-pools-msg");
noLivePoolsMsg.addEventListener("click", gamesDropdownHandler());
function gamesDropdownHandler() {
    return function () {
        let gamesDropdownContainer = (0, document_1.qs)(".games-dropdown-items");
        gamesDropdownContainer.classList.toggle("down");
        let gamesLinksContainer = (0, document_1.qs)(".games-links-container");
        gamesLinksContainer.classList.toggle("games-dropdown-hidden-position");
        moreGamesButton.querySelector("svg").classList.toggle("flipped");
    };
}
//generic nav handler
function navClickHandler_ConnectFirst(event) {
    event.preventDefault();
    if (exports.wallet.isConnected()) {
        //show section with same id as the <anchor> link
        showSection("#" + event.target.closest("a")?.id);
    }
    else {
        showSection("#home");
        loginNearWebWallet();
        // sayChoose()
    }
}
(0, document_1.qs)('nav #unstake-m').onclick = navClickHandler_ConnectFirst;
(0, document_1.qs)('nav #liquidity').onclick = navClickHandler_ConnectFirst;
(0, document_1.qs)('nav #my-account').onclick = navClickHandler_ConnectFirst;
(0, document_1.qs)('nav #faq').onclick = () => { showSection("#faq"); };
function sayChoose() {
    (0, document_1.showMessage)("Please choose a wallet to connect", "Connect first");
}
//button sign-out
(0, document_1.qs)('#sign-out').onclick =
    async function (event) {
        event.preventDefault();
        exports.wallet.disconnect();
        exports.wallet = disconnected_wallet_1.disconnectedWallet;
        signedOutFlow();
    };
//New filters
function filterPools(className) {
    return function (event) {
        filterButtonClicked(event);
        hideAllPools();
        let livePools = (0, document_1.qsa)(`.${className}`);
        // let livePools = qsa("test-no-live-pools-msg")
        showSelectedPools(livePools, className);
    };
}
function filterButtonClicked(event) {
    let previousFilterClicked = (0, document_1.qsa)(".activeFilterButton");
    previousFilterClicked.forEach(button => {
        button.classList.remove("activeFilterButton");
    });
    let buttonClicked = event.target;
    buttonClicked.classList.add("activeFilterButton");
}
function hideAllPools() {
    let allPools = document.querySelectorAll(".pool-container");
    allPools.forEach(pool => {
        pool.classList.add("hidden");
    });
}
function showSelectedPools(selectedPools, className) {
    if (selectedPools.length > 0) {
        (0, document_1.qs)(".no-live-pools-msg").classList.add("hidden");
        selectedPools.forEach(pool => {
            pool.classList.remove("hidden");
        });
    }
    else if (className == "active-pool") {
        (0, document_1.qs)(".no-live-pools-msg").classList.remove("hidden");
    }
}
//Events on filter buttons
(0, document_1.qs)("#live-filter").onclick = filterPools("active-pool");
(0, document_1.qs)("#ended-filter").onclick = filterPools("inactive-pool");
(0, document_1.qs)('#your-farms-filter').onclick = filterPools("your-farms");
function activateClicked(poolParams, pool) {
    return async function (event) {
        event.preventDefault();
        let TXs = [];
        const stakeTokenList = await poolParams.stakingContractData.getStakeTokenContractList();
        for (let i = 0; i < stakeTokenList.length; i++) {
            const tokenContract = stakeTokenList[i].contract;
            const doesNeedStorageDeposit = await needsStorageDeposit(tokenContract);
            if (doesNeedStorageDeposit) {
                TXs.push({
                    promise: tokenContract.storageDepositWithoutSend(),
                    contractName: tokenContract.contractId
                });
            }
        }
        const doesNeedStorageDeposit = await needsStorageDeposit(poolParams.stakingContractData.contract);
        if (doesNeedStorageDeposit) {
            TXs.push({
                promise: poolParams.stakingContractData.contract.storageDepositWithoutSend(),
                contractName: poolParams.stakingContractData.contract.contractId
            });
        }
        await (0, multipleCall_1.callMulipleTransactions)(TXs, poolParams.stakingContractData.contract);
        pool.querySelector("#deposit").classList.remove("hidden");
        pool.querySelector("#activated").classList.add("hidden");
    };
}
async function needsStorageDeposit(contract) {
    if (!exports.wallet.isConnected())
        return false;
    const contractStorageBalanceData = await contract.storageBalance();
    if (contractStorageBalanceData == null)
        return true;
    const contractStorageBalanceBN = new bn_js_1.BN(contractStorageBalanceData.total);
    return !contractStorageBalanceBN.gten(0);
}
async function getUnclaimedRewardsInUSDSingle(poolParams) {
    const rewardToken = "cheddar";
    const rewardTokenData = await (0, oracle_1.getTokenData)(rewardToken);
    const metaData = await poolParams.cheddarContract.ft_metadata();
    const userPoolParams = await poolParams.stakingContractData.getUserStatus();
    const currentRewards = userPoolParams.real;
    const currentRewardsDisplayable = (0, conversions_1.convertToDecimals)(currentRewards, metaData.decimals, 5);
    return parseFloat(rewardTokenData.price) * parseFloat(currentRewardsDisplayable);
}
/**
 *
 * @param tokenContractList
 * @param amountList array containing the amounts to be converted with the metadata decimals included
 * @returns
 */
async function convertToUSDMultiple(tokenContractList, amountList) {
    // const stakeTokenContractList = poolParams.stakeTokenContractList
    //TODO DANI make better. Avoid calling the promise
    await Promise.all(tokenContractList.map((tokenContract) => tokenContract.getMetadata()));
    const rewardTokenArray = tokenContractList.map(tokenContract => tokenContract.getMetadataSync().symbol);
    const rewardTokenDataMap = await (0, oracle_1.getTokenDataArray)(rewardTokenArray);
    let amountInUsd = 0;
    tokenContractList.forEach((tokenContract, index) => {
        const metaData = tokenContract.getMetadataSync();
        const symbol = metaData.symbol;
        const amount = amountList[index];
        // console.log(unclaimedRewards)
        const currentRewardsDisplayable = (0, conversions_1.convertToDecimals)(amount, metaData.decimals, 5);
        const tokenData = rewardTokenDataMap.get(symbol.toLowerCase());
        amountInUsd += parseFloat(tokenData.price) * parseFloat(currentRewardsDisplayable);
    });
    return amountInUsd.toFixed(5);
}
function stakeMultiple(poolParams, newPool) {
    return async function (event) {
        event?.preventDefault();
        (0, document_1.showWait)("Staking...");
        // let stakeContainerList = newPool.querySelectorAll(".main-stake .input-container")  
        let inputArray = [];
        try {
            let unixTimestamp = new Date().getTime() / 1000; //unix timestamp (seconds)
            const contractParams = await poolParams.stakingContractData.getContractParams();
            // const contractParams = poolParams.contractParams
            // const isDateInRange = contractParams.farming_start < unixTimestamp && unixTimestamp < contractParams.farming_end
            const isDateInRange = unixTimestamp < contractParams.farming_end;
            if (!isDateInRange)
                throw Error("Pools is Closed.");
            const { htmlInputArray, amountValuesArray: amountValues, transferedAmountWithSymbolArray: stakedAmountWithSymbol } = await getInputDataMultiple(poolParams, newPool, "stake");
            inputArray = htmlInputArray;
            (0, document_1.qsaAttribute)("input", "disabled", "disabled");
            //get amount
            const min_deposit_amount = 1;
            await poolParams.stake(amountValues);
            if (loggedWithNarwallets) {
                //clear form
                for (let i = 0; i < inputArray.length; i++) {
                    inputArray[i].value = "";
                }
                // const poolUserStatus = await poolParams.stakingContractData.getUserStatus()
                // poolUserStatus.addStaked(amountValues)
                poolParams.stakingContractData.refreshData();
                (0, document_1.showSuccess)(`Staked ${stakedAmountWithSymbol.join(" - ")}`);
            }
        }
        catch (ex) {
            (0, document_1.showErr)(ex);
        }
        // re-enable the form, whether the call succeeded or failed
        inputArray.forEach(input => {
            input.removeAttribute("disabled");
        });
    };
}
function unstakeMultiple(poolParams, newPool) {
    return async function (event) {
        event?.preventDefault();
        (0, document_1.showWait)("Unstaking...");
        // let stakeContainerList = newPool.querySelectorAll(".main-stake .input-container")  
        let inputArray = [];
        try {
            let unixTimestamp = new Date().getTime() / 1000; //unix timestamp (seconds)
            const contractParams = await poolParams.stakingContractData.getContractParams();
            // const contractParams = poolParams.contractParams
            // const isDateInRange = contractParams.farming_start < unixTimestamp && unixTimestamp < contractParams.farming_end
            // const isDateInRange = unixTimestamp > contractParams.farming_start
            // if (!isDateInRange) throw Error("Pools is not open yet.")
            const { htmlInputArray, amountValuesArray: amountValues, transferedAmountWithSymbolArray: unstakedAmountWithSymbol } = await getInputDataMultiple(poolParams, newPool, "unstake");
            inputArray = htmlInputArray;
            (0, document_1.qsaAttribute)("input", "disabled", "disabled");
            //get amount
            const min_deposit_amount = 1;
            await poolParams.unstake(amountValues);
            if (loggedWithNarwallets) {
                //clear form
                for (let i = 0; i < inputArray.length; i++) {
                    inputArray[i].value = "";
                }
                // poolParams.poolUserStatus.addStaked(amountValues.map(value => -value))
                poolParams.stakingContractData.refreshData();
                (0, document_1.showSuccess)(`Staked ${unstakedAmountWithSymbol.join(" - ")}`);
            }
        }
        catch (ex) {
            (0, document_1.showErr)(ex);
        }
        // re-enable the form, whether the call succeeded or failed
        inputArray.forEach(input => {
            input.removeAttribute("disabled");
        });
    };
}
async function getInputDataMultiple(poolParams, newPool, action) {
    let htmlInputArray = [];
    let amountValuesArray = [];
    let stakedAmountWithSymbolArray = [];
    let inputContainerList = newPool.querySelectorAll(`.main-${action} .input-container`);
    const stakeTokenContractList = await poolParams.stakingContractData.getStakeTokenContractList();
    let boundary;
    if (action == "stake") {
        boundary = await poolParams.getWalletAvailable();
    }
    else if (action == "unstake") {
        const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
        boundary = poolUserStatus.stake_tokens;
    }
    else {
        throw Error(`Action ${action} not available`);
    }
    for (let i = 0; i < inputContainerList.length; i++) {
        let stakeContainer = inputContainerList[i];
        let input = stakeContainer.querySelector(".amount");
        htmlInputArray.push(input);
        let amount = parseFloat(input.value);
        if (isNaN(amount)) {
            throw Error("Please Input a Number.");
        }
        // const metaData = stakeTokenContractList[i].metaData
        const currentStakeTokenMetadata = await stakeTokenContractList[i].getMetadata();
        const stakeAmountBN = BigInt((0, conversions_1.convertToBase)(amount.toString(), currentStakeTokenMetadata.decimals.toString()));
        console.log(i, boundary[i]);
        if (BigInt(boundary[i]) < stakeAmountBN) {
            const balanceDisplayable = (0, conversions_1.convertToDecimals)(boundary[i], currentStakeTokenMetadata.decimals, 5);
            throw Error(`Only ${balanceDisplayable} ${currentStakeTokenMetadata.symbol} Available to ${action}.`);
        }
        amountValuesArray.push(stakeAmountBN);
        stakedAmountWithSymbolArray.push(`${amount} ${currentStakeTokenMetadata.symbol}`);
    }
    return {
        htmlInputArray,
        amountValuesArray,
        transferedAmountWithSymbolArray: stakedAmountWithSymbolArray,
    };
}
function stakeSingle(poolParams, newPool) {
    return async function (event) {
        event?.preventDefault();
        (0, document_1.showWait)("Staking...");
        let stakeInput = newPool.querySelector(".main-stake input");
        try {
            // let unixTimestamp = new Date().getTime() / 1000; //unix timestamp (seconds)
            // const contractParams = await poolParams.stakingContractData.getContractParams()
            // const isDateInRange = contractParams.farming_start < unixTimestamp && unixTimestamp < contractParams.farming_end
            // if (!isDateInRange) throw Error("Pools is Closed.")
            stakeInput.setAttribute("disabled", "disabled");
            let stakeAmount = parseFloat(stakeInput.value);
            //get amount
            const min_deposit_amount = 1;
            if (isNaN(stakeAmount)) {
                throw Error("Please Input a Number.");
            }
            const walletAvailable = await poolParams.getWalletAvailable();
            if (stakeAmount > parseFloat(walletAvailable))
                throw Error(`Only ${walletAvailable} ${poolParams.stakeTokenMetaData.symbol} Available to Stake.`);
            const stakeTokenContract = (await poolParams.stakingContractData.getStakeTokenContractList())[0];
            const stakeTokenMetadata = await stakeTokenContract.getMetadata();
            await poolParams.stakeTokenContract.ft_transfer_call(poolParams.stakingContractData.contract.contractId, (0, conversions_1.convertToBase)(stakeAmount.toString(), stakeTokenMetadata.decimals.toString()), "to farm");
            // if (loggedWithNarwallets) {
            //   //clear form
            //   stakeInput.value = ""
            //   poolParams.resultParams.addStaked(ntoy(stakeAmount))
            //   refreshPoolInfo(poolParams, newPool)//Question: shouldnt this be in refreshPoolInfo?
            //   showSuccess("Staked " + toStringDecMin(stakeAmount) + poolParams.stakeTokenMetaData.symbol)
            // }
        }
        catch (ex) {
            (0, document_1.showErr)(ex);
        }
        // re-enable the form, whether the call succeeded or failed
        stakeInput.removeAttribute("disabled");
    };
}
// TODO DANI - implement
function harvestMultipleOrNFT(poolParams, newPool) {
    return async function (event) {
        event?.preventDefault();
        let poolID = poolParams.html.id;
        poolParams.confettiButton?.clickButtonWithRedirection(poolID);
        (0, document_1.showWait)("Harvesting...");
        await poolParams.stakingContractData.contract.withdraw_crop();
        (0, document_1.showSuccess)("Harvested successfully");
    };
}
function harvestSingle(poolParams, newPool) {
    return async function (event) {
        event?.preventDefault();
        (0, document_1.showWait)("Harvesting...");
        let poolID = poolParams.html.id;
        poolParams.confettiButton?.clickButtonWithRedirection(poolID);
        const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
        let amount = poolUserStatus.getCurrentCheddarRewards();
        await poolParams.stakingContractData.contract.withdraw_crop();
        poolUserStatus.computed = 0n;
        poolUserStatus.real = 0n;
        // newPool.querySelector(".unclaimed-rewards-value")!.innerHTML = "0"
        (0, document_1.showSuccess)("Harvested" + (0, conversions_1.toStringDecMin)(parseFloat(amount)) + " CHEDDAR");
    };
}
function unstakeSingle(poolParams, newPool) {
    return async function (event) {
        event?.preventDefault();
        (0, document_1.showWait)("Unstaking...");
        const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
        const stakeTokenContract = (await poolParams.stakingContractData.getStakeTokenContractList())[0];
        const stakeTokenMetadata = await stakeTokenContract.getMetadata();
        let unstakeInput = newPool.querySelector(".main-unstake input");
        try {
            unstakeInput.setAttribute("disabled", "disabled");
            let unstakeAmount = parseFloat(unstakeInput.value);
            const staked = poolUserStatus.staked;
            const stakedDisplayable = Number((0, conversions_1.convertToDecimals)(staked.toString(), stakeTokenMetadata.decimals, 5));
            if (isNaN(unstakeAmount)) {
                throw Error("Please Input a Number.");
            }
            if (unstakeAmount > stakedDisplayable)
                throw Error(`Only ${stakedDisplayable} ${stakeTokenMetadata.symbol} Available to Unstake.`);
            await poolParams.stakingContractData.contract.unstake((0, conversions_1.convertToBase)(unstakeAmount.toString(), stakeTokenMetadata.decimals.toString()));
            // if (loggedWithNarwallets) {
            //   //clear form
            //   unstakeInput.value = ""
            //   //refresh acc info
            //   refreshPoolInfo(poolParams, newPool)
            //   poolUserStatus.addStaked(ntoy(unstakeAmount))
            //   // refreshPoolInfoSingle(poolParams, newPool) //Esta línea la agregué porque pensé que corresponde pero realmente estoy confundido.
            //   showSuccess("Unstaked " + toStringDecMin(unstakeAmount) + poolParams.stakeTokenMetaData.symbol)
            // }
        }
        catch (ex) {
            (0, document_1.showErr)(ex);
        }
        // re-enable the form, whether the call succeeded or failed
        unstakeInput.removeAttribute("disabled");
    };
}
function termsOfUseListener() {
    return async function (event) {
        event.preventDefault();
        (0, document_1.showPopup)("#terms.popup");
    };
}
function showUnstakeResult(unstaked) {
    (0, document_1.showSuccess)(`<div class="stat-line"> <dt>Unstaked</dt><dd>${(0, conversions_1.toStringDec)(unstaked)}</dd> </div>`, "Unstake");
}
function showRemoveLiquidityResult(yoctoCheddar) {
    (0, document_1.showSuccess)(`<div class="stat-line"> <dt>cheddar received</dt><dd>${(0, conversions_1.toStringDec)((0, conversions_1.yton)(yoctoCheddar))}</dd> </div>`, "Withdraw crop");
}
//--------------------------------------
// AutoRefresh
async function autoRefresh() {
    if (exports.wallet && exports.wallet.isConnected()) {
        try {
            //await refreshPoolInfo()
        }
        catch (ex) {
            //console.log("auto-refresh: " + ex.message)
        }
    }
}
//--------------------------------------
function showSection(selector) {
    //hide all sections
    (0, document_1.qsa)("main section").forEach(document_1.hide);
    //show section
    const section = (0, document_1.qs)("main").querySelector(selector);
    if (section) {
        (0, document_1.show)(section);
        selectNav(selector);
    }
    //hide burger button
    (0, document_1.qs)(".burger-button").classList.remove("burger-button--toggle");
    (0, document_1.qs)(".navbar-links").classList.remove("show-right__nav");
}
function selectNav(selector) {
    //nav
    const allNav = (0, document_1.qsa)("nav a");
    allNav.forEach(e => e.classList.remove("selected"));
    (0, document_1.qs)("nav").querySelector(selector)?.classList.add("selected");
}
//after connecting, preserve the amount the user typed on home screen
function takeUserAmountFromHome() {
    let result = "";
    try {
        //move amount typed while not-connected
        const notConnectedStakeInput = (0, document_1.qsi)("#stake-form-not-connected input.near");
        result = notConnectedStakeInput.value;
        //check also local storage
        if (!result)
            result = localStorage.getItem("amount") || "";
        if (result) {
            (0, document_1.qsi)("#stake input.near").value = result;
            notConnectedStakeInput.value = ""; //clear.- move only once
            localStorage.removeItem("amount");
        }
    }
    catch (ex) {
        //ignore
    }
    return result;
}
// Display the signed-out-flow container
async function signedOutFlow() {
    signedInFlow(disconnected_wallet_1.disconnectedWallet);
    // showSection("#home")
    // await refreshAccountInfo();
}
// Displaying the signed in flow container and fill in account-specific data
async function signedInFlow(wallet) {
    showSection("#home-connected");
    selectNav("#home");
    takeUserAmountFromHome();
    // await refreshAccountInfoGeneric(poolList)
    if (wallet.isConnected()) {
        // const poolList = await getPoolList(wallet);    
        // qs(".user-info #account-id").innerText = poolList[0].wallet.getAccountId()
        let walletID = wallet.getDisplayableAccountId();
        let walletDisplayableID;
        if (walletID.length < 15) {
            walletDisplayableID = walletID;
        }
        else {
            walletDisplayableID = walletID.slice(0, 12) + "...";
        }
        let accountIdElement = (0, document_1.qs)(".user-info #account-id");
        accountIdElement.innerText = walletDisplayableID;
        accountIdElement.title = walletID;
        // qs(".not-connected-msg").classList.add("hidden")
    }
    else {
        (0, document_1.qs)(".not-connected-msg").classList.remove("hidden");
        // initButton()
        // If user is disconnected it, account Id is the default disconnected message
        (0, document_1.qs)(".user-info #account-id").innerText = wallet.getAccountId();
    }
}
function setDefaultFilter(didJustActivate = false) {
    let allYourFarmsPools = (0, document_1.qsa)(".your-farms");
    let allLivePools = (0, document_1.qsa)(".active-pool");
    const event = new Event("click");
    //If you don´t have farms show live pools as default. If you just activate a pool show live pools as default.
    if (didJustActivate) {
        (0, document_1.qs)("#live-filter").dispatchEvent(event);
    }
    else if (allYourFarmsPools.length > 0) { /*console.log("Your farms")*/
        (0, document_1.qs)("#your-farms-filter").dispatchEvent(event);
    }
    else if (allLivePools.length > 0) {
        // console.log("Live")
        (0, document_1.qs)("#live-filter").dispatchEvent(event);
    }
    else {
        // console.log("Ended")
        (0, document_1.qs)("#ended-filter").dispatchEvent(event);
    }
}
// Initialize contract & set global variables
async function initNearWebWalletConnection() {
    // Initialize connection to the NEAR network
    const near = await (0, near_api_js_1.connect)(Object.assign({ deps: { keyStore: new near_api_js_1.keyStores.BrowserLocalStorageKeyStore() } }, exports.nearConfig));
    // Initializing Wallet based Account.
    nearWebWalletConnection = new near_api_js_1.WalletConnection(near, null);
    nearConnectedWalletAccount = new near_api_js_1.ConnectedWalletAccount(nearWebWalletConnection, near.connection, nearWebWalletConnection.getAccountId());
    //console.log(nearConnectedWalletAccount)
}
function logoutNearWebWallet() {
    nearWebWalletConnection.signOut();
    exports.wallet = disconnected_wallet_1.disconnectedWallet;
    // reload page
    window.location.replace(window.location.origin + window.location.pathname);
}
function loginNearWebWallet() {
    // Allow the current app to make calls to the specified contract on the user's behalf.
    // This works by creating a new access key for the user's account and storing
    // the private key in localStorage.
    //save what the user typed before navigating out
    // localStorage.setItem("amount", qsi("#stake-form-not-connected input.near").value)
    nearWebWalletConnection.requestSignIn(exports.nearConfig.farms[0].contractName);
}
function loginNarwallets() {
    //login is initiated from the chrome-extension
    //show step-by-step instructions
    window.open("http://www.narwallets.com/help/connect-to-web-app");
}
function showOrHideMaxButton(walletBalance, elem) {
    if (walletBalance > 0) {
        elem.classList.remove("hidden");
    }
    else {
        elem.classList.add("hidden");
    }
}
function setDateInRangeVisualIndication(poolParams, newPool, isDateInRange) {
    let dateInRangeIndicator = newPool.querySelector(".date-in-range-indicator circle");
    if (isDateInRange) {
        dateInRangeIndicator.classList.remove("offDate");
        dateInRangeIndicator.classList.add("onDate");
    }
    else {
        dateInRangeIndicator.classList.remove("onDate");
        dateInRangeIndicator.classList.add("offDate");
    }
    let allUnclaimedRewardsTotalAmount = 0;
    let allUnclaimedRewardsDetails = newPool.querySelectorAll(".unclaimed-rewards-info-container .detail-row");
    allUnclaimedRewardsDetails.forEach(unclaimedRewardDetail => {
        let amountContainer = unclaimedRewardDetail.querySelector(".content");
        let amount = Number(amountContainer.innerHTML);
        allUnclaimedRewardsTotalAmount += amount;
    });
    let unclaimedRewards = newPool.querySelector(".unclaimed-rewards");
    let unclaimedRewardsValue = newPool.querySelector(".unclaimed-rewards-value-usd");
    if (allUnclaimedRewardsTotalAmount == 0) {
        unclaimedRewards.classList.remove("no-opacity");
        unclaimedRewardsValue.classList.remove("no-opacity");
        allUnclaimedRewardsDetails.forEach(unclaimedRewardDetail => {
            unclaimedRewardDetail.classList.remove("no-opacity");
        });
    }
    else {
        unclaimedRewards.classList.add("no-opacity");
        unclaimedRewardsValue.classList.add("no-opacity");
        allUnclaimedRewardsDetails.forEach(unclaimedRewardDetail => {
            unclaimedRewardDetail.classList.add("no-opacity");
        });
    }
}
async function refreshPoolInfoSingle(poolParams, newPool) {
    await poolParams.refreshAllExtraData();
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const userPoolParams = await poolParams.stakingContractData.getUserStatus();
    await updateDetail(newPool, poolParams.stakeTokenContractList, [contractParams.total_staked], "total-staked");
    // updateDetail(newPool, poolParams.farmTokenContractList, [poolParams.contractParams.total_farmed], "apr")
    await updateDetail(newPool, poolParams.farmTokenContractList, convertRewardsRates([contractParams.farming_rate.toString()]), "rewards-per-day");
    await uptadeDetailIfNecesary(poolParams, newPool, [await poolParams.getFarmTokenContractData()], [userPoolParams.real.toString()], "unclaimed-rewards");
    const stakeBalances = await Promise.all(poolParams.stakeTokenContractList.map(stakeCD => stakeCD.getBalance()));
    // const stakeBalances = poolParams.stakeTokenContractList.map(stakeCD => stakeCD.getBalanceSync())
    await refreshInputAmounts(poolParams, newPool, "main-stake", stakeBalances);
    await refreshInputAmounts(poolParams, newPool, "main-unstake", [userPoolParams.staked.toString()]);
    if (userPoolParams.staked == 0n) {
        newPool.classList.remove("your-farms");
        let doesPoolNeedDeposit = await needsStorageDeposit(poolParams.stakeTokenContract);
        const stakeTokenList = poolParams.stakeTokenContractList;
        for (let i = 0; i < stakeTokenList.length && !doesPoolNeedDeposit; i++) {
            const tokenContract = stakeTokenList[i].contract;
            const doesTokenNeedStorageDeposit = await needsStorageDeposit(tokenContract);
            if (doesTokenNeedStorageDeposit) {
                doesPoolNeedDeposit = true;
            }
        }
        if (!doesPoolNeedDeposit && newPool.classList.contains("inactive-pool")) {
            newPool.querySelector("#activate")?.classList.add("hidden");
        }
        else {
            newPool.querySelector("#activate")?.classList.remove("hidden");
        }
    }
    const now = Date.now() / 1000;
    const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
    if (!isDateInRange) {
        resetSinglePoolListener(poolParams, newPool, refreshPoolInfoSingle, -1);
    }
    setDateInRangeVisualIndication(poolParams, newPool, isDateInRange);
}
async function refreshNFTOrMultiplePoolInfo(poolParams, newPool) {
    await poolParams.refreshAllExtraData();
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
    const stakeTokenContractList = await poolParams.stakingContractData.getStakeTokenContractList();
    const farmTokenContractList = await poolParams.stakingContractData.getFarmTokenContractList();
    if (poolParams instanceof poolParamsP3_1.PoolParamsP3) {
        await updateDetail(newPool, await stakeTokenContractList, contractParams.total_staked, "total-staked");
    }
    else if (poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
        newPool.querySelector(".total-staked-value-usd").innerHTML = `${contractParams.total_staked} NFT's`;
    }
    // updateDetail(newPool, poolParams.farmTokenContractList, poolParams.contractParams.total_farmed, "apr")
    const rewardsTokenDataArray = await poolParams.getRewardsTokenDetail();
    const rewardsPerDay = rewardsTokenDataArray.map(data => data.rewardsPerDayBN.toString());
    await updateDetail(newPool, farmTokenContractList, rewardsPerDay, "rewards-per-day");
    await updateDetail(newPool, farmTokenContractList, poolUserStatus.farmed_tokens, "unclaimed-rewards");
    const now = Date.now() / 1000;
    const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
    if (poolParams instanceof poolParamsP3_1.PoolParamsP3) {
        const stakeBalances = await Promise.all(stakeTokenContractList.map(stakeCD => stakeCD.getBalance()));
        await refreshInputAmounts(poolParams, newPool, "main-stake", stakeBalances);
        // On PoolParamsP3 the poolUserStatus.stake_tokens is always a string[]
        await refreshInputAmounts(poolParams, newPool, "main-unstake", poolUserStatus.stake_tokens);
        if (!isDateInRange) {
            resetMultiplePoolListener(poolParams, newPool, refreshNFTOrMultiplePoolInfo, -1);
        }
    }
    else if (poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
        if (!isDateInRange) {
            resetNFTPoolListener(poolParams, newPool, refreshNFTOrMultiplePoolInfo, -1);
        }
    }
    setBoostDisplay(poolParams, newPool);
    setDateInRangeVisualIndication(poolParams, newPool, isDateInRange);
}
async function refreshInputAmounts(poolParams, newPool, className, amounts) {
    const inputArray = newPool.querySelectorAll(`.${className} .token-input-container`);
    const stakeTokenContractList = await poolParams.stakingContractData.getStakeTokenContractList();
    for (let i = 0; i < inputArray.length; i++) {
        const input = inputArray[i];
        const tokenContractData = stakeTokenContractList[i];
        const balance = amounts[i];
        const metadata = await tokenContractData.getMetadata();
        const balanceDisplayable = (0, conversions_1.convertToDecimals)(balance, metadata.decimals, 5);
        input.querySelector(".value").innerHTML = balanceDisplayable;
        const maxButton = input.querySelector(".max-button");
        showOrHideMaxButton(Number(balanceDisplayable), maxButton);
    }
}
function convertRewardsRates(rates) {
    return rates.map(rate => (BigInt(rate) * 60n * 24n).toString());
}
async function updateDetail(newPool, contractList, totals, baseClass) {
    // CHECK 2
    const totalInUsd = await convertToUSDMultiple(contractList, totals);
    newPool.querySelector(`.${baseClass}-row .${baseClass}-value-usd`).innerHTML = `$ ${totalInUsd}`;
    const totalDetailsElements = newPool.querySelectorAll(`.${baseClass}-info-container .detail-row`);
    for (let i = 0; i < totalDetailsElements.length; i++) {
        const row = totalDetailsElements[i];
        const tokenMetadata = await contractList[i].getMetadata();
        const content = (0, conversions_1.convertToDecimals)(totals[i], tokenMetadata.decimals, 5);
        row.querySelector(".content").innerHTML = content;
    }
}
async function uptadeDetailIfNecesary(poolParams, newPool, contractList, totals, baseClass) {
    let doesPoolNeedDeposit = await needsStorageDeposit(poolParams.stakingContractData.contract);
    const stakeTokenList = poolParams.stakeTokenContractList;
    for (let i = 0; i < stakeTokenList.length && !doesPoolNeedDeposit; i++) {
        const tokenContract = stakeTokenList[i].contract;
        const doesTokenNeedStorageDeposit = await needsStorageDeposit(tokenContract);
        if (doesTokenNeedStorageDeposit) {
            doesPoolNeedDeposit = true;
        }
    }
    if (!doesPoolNeedDeposit) {
        await updateDetail(newPool, contractList, totals, baseClass);
    }
}
async function refreshAccountInfoGeneric(poolList) {
    poolList.forEach(poolParams => {
        //refreshPoolInfo(poolParams)
    });
}
/// when the user chooses "connect to web-page" in the narwallets-chrome-extension
function narwalletConnected(ev) {
    exports.wallet = narwallets_1.narwallets;
    loggedWithNarwallets = true;
    signedInFlow(exports.wallet);
}
/// when the user chooses "disconnect from web-page" in the narwallets-chrome-extension
function narwalletDisconnected(ev) {
    loggedWithNarwallets = false;
    exports.wallet = disconnected_wallet_1.disconnectedWallet;
    signedOutFlow();
}
function calculateAmountHaveStaked(stakeRates, amount, amountIndex, newAmountIndex) {
    const amountToStake = amount * stakeRates[newAmountIndex] / stakeRates[amountIndex];
    return amountToStake;
}
function calculateAmountToStake(stakeRates, totalStaked, amount, inputIndex, outputIndex) {
    const totalAmountStakedWithThisStake = totalStaked[inputIndex] + amount;
    const amountToStake = totalAmountStakedWithThisStake * stakeRates[inputIndex] / stakeRates[outputIndex] - totalStaked[outputIndex];
    return amountToStake > 0n ? amountToStake : 0n;
}
function calculateAmountToUnstake(stakeRates, totalStaked, amount, alreadySetIndex, newIndex) {
    const totalAmountStakedWithThisUnstake = totalStaked[alreadySetIndex] - amount;
    const output = totalStaked[newIndex] - totalAmountStakedWithThisUnstake * stakeRates[alreadySetIndex] / stakeRates[newIndex];
    return output > 0n ? output : 0n;
}
function autoFillStakeAmount(poolParams, pool, inputRoute, indexInputToken) {
    return async function (event) {
        event.preventDefault();
        const value1 = event.target.value;
        // const amountToStake = BigInt(value1)
        const stakeTokenContractList = await poolParams.stakingContractData.getStakeTokenContractList();
        const inputTokenMetadata = await stakeTokenContractList[indexInputToken].getMetadata();
        const amountToStakingOrUnstaking = BigInt((0, conversions_1.convertToBase)(value1, inputTokenMetadata.decimals.toString()));
        const contractParams = await poolParams.stakingContractData.getContractParams();
        const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
        let inputs = pool.querySelectorAll(`${inputRoute} input`);
        const stakeRates = contractParams.stake_rates.map((rate) => BigInt(rate));
        const totalStakedByUser = poolUserStatus.stake_tokens.map(total => BigInt(total));
        for (let indexOutputToken = 0; indexOutputToken < inputs.length; indexOutputToken++) {
            if (indexOutputToken != indexInputToken) {
                let amountToTransferSecondaryBN;
                if (inputRoute.includes("unstake")) {
                    amountToTransferSecondaryBN = calculateAmountToUnstake(stakeRates, totalStakedByUser, amountToStakingOrUnstaking, indexInputToken, indexOutputToken);
                }
                else {
                    amountToTransferSecondaryBN = calculateAmountToStake(stakeRates, totalStakedByUser, amountToStakingOrUnstaking, indexInputToken, indexOutputToken);
                }
                const currentStakeTokenMetadata = await stakeTokenContractList[indexOutputToken].getMetadata();
                const amountToStakeSecondary = (0, conversions_1.convertToDecimals)(amountToTransferSecondaryBN, currentStakeTokenMetadata.decimals, 5);
                // const amountToStakeSecondary
                inputs.item(indexOutputToken).value = amountToStakeSecondary;
            }
        }
    };
}
async function addPoolSingle(poolParams, newPool) {
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const userStatus = await poolParams.stakingContractData.getUserStatus();
    const stakeTokenContractData = await poolParams.getStakeTokenContractData();
    const farmTokenContractData = await poolParams.getFarmTokenContractData();
    var metaData = await poolParams.stakeTokenContractList[0].getMetadata();
    let iconElem = newPool.querySelectorAll("#token-logo-container img");
    iconElem.forEach(icon => {
        icon.setAttribute("src", metaData.icon || "");
    });
    await addInput(newPool, stakeTokenContractData, "stake");
    await addInput(newPool, stakeTokenContractData, "unstake", userStatus.staked.toString());
    await addHeader(poolParams, newPool);
    let unclaimedRewards = await getUnclaimedRewardsInUSDSingle(poolParams);
    const now = Date.now() / 1000;
    const isDateInRange = now < contractParams.farming_end;
    if (Number(unclaimedRewards.toFixed(7)) != 0) {
        newPool.querySelector(".unclaimed-rewards-value-usd").innerHTML = `$ ${unclaimedRewards.toFixed(7).toString()}`;
    }
    else if ((Number(unclaimedRewards.toFixed(7)) != 0) && isDateInRange) {
        newPool.querySelector(".unclaimed-rewards-value-usd").innerHTML = `$ 0`;
    }
    else {
        newPool.querySelector(".unclaimed-rewards-value-usd").innerHTML = `$ -`;
    }
    const totalStakedInUsd = await convertToUSDMultiple([stakeTokenContractData], [contractParams.total_staked]);
    const rewardsPerDayInUsd = await convertToUSDMultiple([farmTokenContractData], [(BigInt(contractParams.farming_rate) * 60n * 24n).toString()]);
    newPool.querySelector(".total-staked-value-usd").innerHTML = `$ ${totalStakedInUsd}`;
    newPool.querySelector(".rewards-per-day-value-usd").innerHTML = `$ ${rewardsPerDayInUsd}`;
    const apr = calculateAPR(totalStakedInUsd, rewardsPerDayInUsd, isDateInRange);
    newPool.querySelector(".apr-value").innerHTML = `${apr}%`;
    addSinglePoolListeners(poolParams, newPool);
}
function calculateAPR(totalStakedInUsd, rewardsPerDayInUsd, isDateInRange) {
    if (!isDateInRange) {
        return "-";
    }
    else {
        return (365 * Number(rewardsPerDayInUsd) / Number(totalStakedInUsd) * 100).toFixed(2);
    }
}
async function addTokenFarmLogos(poolParams, header) {
    let tokenContractDataArray;
    if (poolParams instanceof poolParams_1.PoolParams) {
        tokenContractDataArray = poolParams.stakeTokenContractList;
    }
    else {
        tokenContractDataArray = await poolParams.stakingContractData.getStakeTokenContractList();
    }
    // tokenContractDataArray: TokenContractData[] = poolParams.stakingContractData
    const logoContainer = header.querySelector(".token-logo-container");
    logoContainer.innerHTML = "";
    let i = 0;
    for (; i < tokenContractDataArray.length; i++) {
        const tokenIconData = tokenContractDataArray[i];
        let metaData;
        metaData = await tokenIconData.getMetadata();
        addLogo(metaData, logoContainer, i);
    }
    logoContainer.classList.add(`have-${tokenContractDataArray.length}-elements`);
}
async function addNFTFarmLogo(poolParams, header) {
    // NFTContractData: TokenContractData[] = poolParams.stakingContractData
    const logoContainer = header.querySelector(".token-logo-container");
    logoContainer.innerHTML = "";
    const tokenLogoElement = (0, document_1.qs)(".generic-token-logo-img");
    let newTokenLogoElement = tokenLogoElement.cloneNode(true);
    // For the time being there is only one token
    // const baseUrl = poolParams.stakingContractData.nftBaseUrl[0]
    const stakeNFTContractList = await poolParams.stakingContractData.getStakeNFTContractList();
    const metadata = await stakeNFTContractList[0].getMetadata();
    let imgUrl = metadata.icon;
    if (!imgUrl) {
        imgUrl = poolParams.config.logo;
    }
    newTokenLogoElement?.setAttribute("src", imgUrl);
    newTokenLogoElement?.setAttribute("alt", metadata.name);
    toggleGenericClass(newTokenLogoElement);
    newTokenLogoElement.classList.add(`farmed-token-logo`);
    logoContainer.append(newTokenLogoElement);
    logoContainer.classList.add(`have-1-elements`);
}
async function addAllLogos(poolParams, header) {
    if (poolParams instanceof poolParams_1.PoolParams || poolParams instanceof poolParamsP3_1.PoolParamsP3) {
        addTokenFarmLogos(poolParams, header);
    }
    else if (poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
        addNFTFarmLogo(poolParams, header);
    }
}
async function addHeader(poolParams, newPool) {
    const genericHeader = (0, document_1.qs)(".generic-new-pool-header");
    const newHeader = genericHeader.cloneNode(true);
    await addAllLogos(poolParams, newHeader);
    const poolContainer = newPool.querySelector("#pool-container");
    const tokenPoolStatsContainer = newPool.querySelector("#token-pool-stats");
    poolContainer.prepend(newHeader);
    toggleGenericClass(newHeader);
    const newTokenPoolStats = newHeader.cloneNode(true);
    tokenPoolStatsContainer.prepend(newTokenPoolStats);
}
async function addMultiplePoolListeners(poolParams, newPool) {
    addAllCommonListeners(poolParams, newPool);
    let tokenSymbols = [];
    const stakeTokenContractList = await poolParams.stakingContractData.getStakeTokenContractList();
    for (let i = 0; i < stakeTokenContractList.length; i++) { // Harvest button listener
        const contractData = stakeTokenContractList[i];
        const currentStakeTokenMetadata = await contractData.getMetadata();
        tokenSymbols.push(`${currentStakeTokenMetadata.symbolForHtml.toLowerCase()}`);
    }
    newPool.querySelector(".confetti-button")?.addEventListener("click", harvestMultipleOrNFT(poolParams, newPool));
    for (let i = 0; i < tokenSymbols.length; i++) { // Autofill inputs with correct rates
        newPool.querySelector(`.main-stake .${tokenSymbols[i]}-input input`).addEventListener("input", autoFillStakeAmount(poolParams, newPool, `.main-stake`, i));
        newPool.querySelector(`.main-unstake .${tokenSymbols[i]}-input input`).addEventListener("input", autoFillStakeAmount(poolParams, newPool, `.main-unstake`, i));
    }
    // Stake/unstake buttons
    newPool.querySelector("#stake-button")?.addEventListener("click", stakeMultiple(poolParams, newPool));
    newPool.querySelector("#unstake-button")?.addEventListener("click", unstakeMultiple(poolParams, newPool));
    setAllInputMaxButtonListeners(newPool);
    // Refresh every 5 seconds if it's live
    const now = Date.now() / 1000;
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
    let refreshIntervalId = -1;
    if (isDateInRange) {
        refreshIntervalId = window.setInterval(refreshNFTOrMultiplePoolInfo.bind(null, poolParams, newPool), refreshTime);
    }
    //Info to transfer so we can check what pool is loading the NFTs
    let boostButton = newPool.querySelector(".boost-button");
    let boostButtonId = boostButton.id;
    boostButton.addEventListener("click", showNFTGrid(poolParams, boostButtonId));
    // Hover events
    standardHoverToDisplayExtraInfo(newPool, "total-staked");
    // standardHoverToDisplayExtraInfo(newPool, "apr")
    standardHoverToDisplayExtraInfo(newPool, "rewards-per-day");
    standardHoverToDisplayExtraInfo(newPool, "reward-tokens");
    standardHoverToDisplayExtraInfo(newPool, "unclaimed-rewards");
}
async function addNFTPoolListeners(poolParams, newPool) {
    addAllCommonListeners(poolParams, newPool);
    let tokenSymbols = [];
    const stakeTokenContractList = await poolParams.stakingContractData.getStakeTokenContractList();
    for (let i = 0; i < stakeTokenContractList.length; i++) { // Harvest button listener
        const contractData = stakeTokenContractList[i];
        const currentStakeTokenMetadata = await contractData.getMetadata();
        tokenSymbols.push(`${currentStakeTokenMetadata.symbolForHtml.toLowerCase()}`);
    }
    newPool.querySelector(".confetti-button")?.addEventListener("click", harvestMultipleOrNFT(poolParams, newPool));
    let stakeUnstakeNftButton = newPool.querySelector("#stake-unstake-nft");
    let stakeUnstakeNftButtonId = stakeUnstakeNftButton.id;
    stakeUnstakeNftButton.addEventListener("click", async function () {
        stakeUnstakeNftButton.disabled = true;
        stakeUnstakeNftButton.innerHTML = "Loading...";
        await showStakeUnstakeNFTGrid(poolParams, stakeUnstakeNftButtonId);
        stakeUnstakeNftButton.disabled = false;
        stakeUnstakeNftButton.innerHTML = "STAKE/UNSTAKE";
    });
    // Refresh every 60 seconds if it's live
    const now = Date.now() / 1000;
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
    let refreshIntervalId = -1;
    if (isDateInRange) {
        refreshIntervalId = window.setInterval(refreshNFTOrMultiplePoolInfo.bind(null, poolParams, newPool), refreshTime);
    }
    //Info to transfer so we can check what pool is loading the NFTs
    let boostButton = newPool.querySelector(".boost-button");
    let boostButtonId = boostButton.id;
    boostButton.addEventListener("click", showNFTGrid(poolParams, boostButtonId));
    // Hover events
    standardHoverToDisplayExtraInfo(newPool, "total-staked");
    // standardHoverToDisplayExtraInfo(newPool, "apr")
    standardHoverToDisplayExtraInfo(newPool, "rewards-per-day");
    standardHoverToDisplayExtraInfo(newPool, "reward-tokens");
    standardHoverToDisplayExtraInfo(newPool, "unclaimed-rewards");
}
function addPoolTokensDescription(newPool, poolParams) {
    const legendContainer = newPool.querySelector(".pool-legend");
    let poolLegends = poolParams.poolDescription;
    if (poolLegends != undefined) {
        for (let i = 0; i < poolLegends.length; i++) {
            const descriptionLinks = poolParams.descriptionLink;
            if (descriptionLinks != undefined) {
                poolLegends[i] += `<a href="${descriptionLinks[i]}" target="_blank"> here.</a></br>`;
            }
            legendContainer.innerHTML += poolLegends[i];
            legendContainer.classList.remove("hidden");
        }
    }
}
async function addNFTPool(poolParams, newPool) {
    const farmTokenContractList = await poolParams.stakingContractData.getFarmTokenContractList();
    let contractParams = await poolParams.stakingContractData.getContractParams();
    await addHeader(poolParams, newPool);
    const rewardsTokenDataArray = await poolParams.getRewardsTokenDetail();
    const rewardsPerDay = rewardsTokenDataArray.map(data => data.rewardsPerDayBN.toString());
    const rewardsPerDayInUsd = await convertToUSDMultiple(farmTokenContractList, rewardsPerDay);
    newPool.querySelector(".rewards-per-day-value-usd").innerHTML = `$ ${rewardsPerDayInUsd}`;
    if (!poolParams.config.noBoost) {
        newPool.querySelector(".boost-button").classList.remove("hidden");
    }
    else {
        newPool.querySelector(".equal-width-than-boost-button").classList.add("hidden");
        let harvestSection = newPool.querySelector(".harvest-section");
        harvestSection.style.justifyContent = "center";
    }
    newPool.querySelector(".structural-in-simple-pools").classList.add("hidden");
    //TODO DANI check apr and staked value
    // let farmTokenContractList = await poolParams.stakingContractData.getFarmTokenContractList()
    const now = Date.now() / 1000;
    const isDateInRange = now < contractParams.farming_end;
    let farmTokenRateInUSD = await convertToUSDMultiple(farmTokenContractList, contractParams.farm_token_rates);
    let NFTDepositedx100 = Number(contractParams.total_staked[0]) * 100;
    // const apr =  rewards. emission_rate * minutes * hours * 365 / <number of NFT's deposited> * 100
    let apr = calculateAPR(farmTokenRateInUSD, NFTDepositedx100.toString(), isDateInRange);
    newPool.querySelector(".apr-value").innerHTML = `${apr}%`;
    setBoostDisplay(poolParams, newPool);
    addNFTPoolListeners(poolParams, newPool);
    refreshNFTOrMultiplePoolInfo(poolParams, newPool);
}
async function addPoolMultiple(poolParams, newPool) {
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
    const stakeTokenContractList = await poolParams.stakingContractData.getStakeTokenContractList();
    const farmTokenContractList = await poolParams.stakingContractData.getFarmTokenContractList();
    await addHeader(poolParams, newPool);
    let tokenSymbols = [];
    await poolParams.getWalletAvailable();
    for (let i = 0; i < stakeTokenContractList.length; i++) {
        const contractData = stakeTokenContractList[i];
        const metaData = await contractData.getMetadata();
        await addInput(newPool, contractData, "stake");
        await addInput(newPool, contractData, "unstake", poolUserStatus.stake_tokens[i]);
        tokenSymbols.push(`${metaData.symbolForHtml.toLowerCase()}`);
    }
    //Show boost button patch (since simple pools will disapear and they have problems with the boost button)
    newPool.querySelector(".boost-button").classList.remove("hidden");
    newPool.querySelector(".structural-in-simple-pools").classList.add("hidden");
    const unclaimedRewards = Number(await convertToUSDMultiple(farmTokenContractList, poolUserStatus.farmed_tokens));
    // const unclaimedRewards = Number(await convertToUSDMultiple(poolParams.farmTokenContractList, poolParams.resultParams.farmed))
    const now = Date.now() / 1000;
    const isDateInRange = now < contractParams.farming_end;
    if (Number(unclaimedRewards.toFixed(7)) != 0) {
        newPool.querySelector(".unclaimed-rewards-value-usd").innerHTML = `$ ${unclaimedRewards.toFixed(7).toString()}`;
    }
    else if ((Number(unclaimedRewards.toFixed(7)) != 0) && isDateInRange) {
        newPool.querySelector(".unclaimed-rewards-value-usd").innerHTML = `$ 0`;
    }
    else {
        newPool.querySelector(".unclaimed-rewards-value-usd").innerHTML = `$ -`;
    }
    const totalStakedInUsd = await convertToUSDMultiple(stakeTokenContractList, contractParams.total_staked);
    // CHECK!
    const legendContainer = newPool.querySelector(".pool-legend");
    let poolLegends = poolParams.poolDescription;
    if (poolLegends != undefined) {
        for (let i = 0; i < poolLegends.length; i++) {
            const descriptionLinks = poolParams.descriptionLink;
            if (descriptionLinks != undefined) {
                poolLegends[i] += `<a href="${descriptionLinks[i]}" target="_blank"> here.</a>`;
            }
            legendContainer.innerHTML += poolLegends[i] + "</br>";
            legendContainer.classList.remove("hidden");
        }
    }
    const rewardsTokenDataArray = await poolParams.getRewardsTokenDetail();
    const rewardsPerDay = rewardsTokenDataArray.map(data => data.rewardsPerDayBN.toString());
    const rewardsPerDayInUsd = await convertToUSDMultiple(farmTokenContractList, rewardsPerDay);
    newPool.querySelector(".total-staked-row .total-staked-value-usd").innerHTML = `$ ${totalStakedInUsd}`;
    // newPool.querySelector(".apr-row .apr-value")!.innerHTML = `$ ${totalFarmedInUsd}`
    newPool.querySelector(".rewards-per-day-value-usd").innerHTML = `$ ${rewardsPerDayInUsd}`;
    const apr = calculateAPR(totalStakedInUsd, rewardsPerDayInUsd, isDateInRange);
    newPool.querySelector(".apr-value").innerHTML = `${apr}%`;
    setBoostDisplay(poolParams, newPool);
    addMultiplePoolListeners(poolParams, newPool);
}
async function setBoostDisplay(poolParams, newPool) {
    const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
    let hasNFTStaked;
    if ("boost_nfts" in poolUserStatus) {
        hasNFTStaked = poolUserStatus.boost_nfts != '';
    }
    else {
        hasNFTStaked = poolUserStatus.cheddy_nft != '';
    }
    // hasNFTStaked = poolUserStatus.cheddy_nft != ''
    if (hasNFTStaked) {
        newPool.querySelector(".boost-button svg").setAttribute("class", "full");
        newPool.querySelector(".boost-button span").innerHTML = "BOOSTED";
    }
    else {
        newPool.querySelector(".boost-button svg").setAttribute("class", "empty");
        newPool.querySelector(".boost-button span").innerHTML = "BOOST";
    }
}
function addFocusClass(input) {
    return function (event) {
        event?.preventDefault;
        input.classList.toggle("focused");
    };
}
async function addInput(newPool, contractData, action, stakedAmount) {
    let inputContainer = (0, document_1.qs)(".generic-token-input-container");
    var newInputContainer = inputContainer.cloneNode(true);
    let inputRowContainer = newInputContainer.querySelector(".input-container");
    let infoRowContainer = newInputContainer.querySelector(".available-info");
    let input = newInputContainer.querySelector("input");
    const metaData = await contractData.getMetadata();
    newInputContainer.classList.remove("generic-token-input-container");
    newInputContainer.classList.add("token-input-container");
    newInputContainer.classList.add(`${metaData.symbolForHtml.toLowerCase()}-input`);
    newInputContainer.classList.remove(`hidden`);
    newInputContainer.querySelector(".available-info span").innerHTML = `Available to ${action}`;
    newInputContainer.querySelector(".amount-available")?.classList.add(action);
    input.addEventListener("focus", addFocusClass(inputRowContainer));
    input.addEventListener("blur", addFocusClass(inputRowContainer));
    let inputLogoContainer = newInputContainer.querySelector(".input-container .token-logo");
    let amountAvailableValue = newInputContainer.querySelector(".amount-available .value");
    let maxButton = infoRowContainer.querySelector(".max-button");
    if (metaData.icon != null) {
        if (metaData.icon.startsWith("data:image")) {
            let tokenLogoElement = newInputContainer.querySelector("img.token-logo");
            tokenLogoElement?.setAttribute("src", metaData.icon);
            inputLogoContainer?.classList.remove("hidden");
        }
        else if (metaData.icon.startsWith("<svg")) {
            let tokenLogoElement = newInputContainer.querySelector("div.token-logo-svg-container");
            tokenLogoElement.innerHTML = metaData.icon;
            tokenLogoElement.classList.remove("hidden");
        }
    }
    else {
        inputLogoContainer.innerHTML = `${metaData.name}`;
        inputLogoContainer?.classList.remove("hidden");
    }
    const balance = await contractData.getBalance();
    if (action == "stake") {
        amountAvailableValue.innerHTML = (0, conversions_1.convertToDecimals)(balance, metaData.decimals, 5);
    }
    else if (action == "unstake") {
        amountAvailableValue.innerHTML = (0, conversions_1.convertToDecimals)(stakedAmount, metaData.decimals, 5);
    }
    const balanceDisplayable = (0, conversions_1.convertToDecimals)(balance, metaData.decimals, 5);
    showOrHideMaxButton(Number(balanceDisplayable), maxButton);
    newPool.querySelector(`.main-${action}`).append(newInputContainer);
}
async function toggleExpandStakeUnstakeSection(newPool, elemWithListener) {
    let expandPoolButton = newPool.querySelector(".expand-button");
    // let hidePoolButton = newPool.querySelector(".hide-button")! as HTMLElement;
    let stakingUnstakingContainer = newPool.querySelector("#activated");
    elemWithListener.addEventListener("click", flipElement(expandPoolButton));
    elemWithListener.addEventListener("click", toggleActions(stakingUnstakingContainer));
}
function standardHoverToDisplayExtraInfo(newPool, className) {
    const elementWithListenner = newPool.querySelector(`.${className}-value-usd`);
    const elementShown = newPool.querySelector(`.${className}-info-container`);
    elementWithListenner.addEventListener("mouseover", toggleElement(elementShown));
    elementWithListenner.addEventListener("mouseout", toggleElement(elementShown));
    elementShown.addEventListener("mouseover", showElement(elementShown));
    elementShown.addEventListener("mouseout", hideElement(elementShown));
}
function hideAllDynamicElements(newPool) {
    newPool.querySelectorAll(".dynamic-display-element").forEach((elem) => {
        elem.classList.add("hidden");
    });
}
async function addAllCommonListeners(poolParams, newPool) {
    let infoIcon = newPool.querySelector(".new-pool-header .information-icon-container");
    let poolStats = newPool.querySelector("#token-pool-stats");
    infoIcon.addEventListener("mouseover", showElement(poolStats));
    poolStats.addEventListener("mouseover", showElement(poolStats));
    poolStats.addEventListener("mouseout", hideElement(poolStats));
    // let harvestButton = newPool.querySelector(".confetti-button") as HTMLButtonElement
    // //You can check how to configure it in https://party.js.org/
    // let confettiConfiguration = {
    //   count: party.variation.range(25,30),
    //   spread: party.variation.range(20,25)
    // }
    // harvestButton.addEventListener("click", function () {
    //   party.confetti(harvestButton, confettiConfiguration);
    // });
    let doesNeedStorageDeposit;
    if (poolParams instanceof poolParams_1.PoolParams) {
        doesNeedStorageDeposit = false;
    }
    else {
        doesNeedStorageDeposit = await needsStorageDeposit(poolParams.stakingContractData.contract);
    }
    // Displays staking/unstaking when hovering on the pool(only in Live and Your Farms)
    if (!(poolParams instanceof poolParamsNFT_1.PoolParamsNFT) && !doesNeedStorageDeposit && !newPool.classList.contains("inactive-pool")) {
        let vanishingIndicator = newPool.querySelector("#vanishing-indicator");
        vanishingIndicator?.classList.remove("transparent");
        vanishingIndicator?.classList.add("visual-tool-expanding-indication-hidden");
        newPool.addEventListener("mouseover", paintOrUnPaintElement("visual-tool-expanding-indication-hidden", vanishingIndicator));
        newPool.addEventListener("mouseout", paintOrUnPaintElement("visual-tool-expanding-indication-hidden", vanishingIndicator));
        let expandButtonStakingUnstaking = newPool.querySelector(".expand-button");
        newPool.addEventListener("mouseover", makeBlinkElement(expandButtonStakingUnstaking));
        newPool.addEventListener("mouseout", makeBlinkElement(expandButtonStakingUnstaking));
    }
}
async function addSinglePoolListeners(poolParams, newPool) {
    addAllCommonListeners(poolParams, newPool);
    // Harvest button listener
    const contractData = await poolParams.getStakeTokenContractData();
    const metaData = await contractData.getMetadata();
    newPool.querySelector(".confetti-button")?.addEventListener("click", harvestSingle(poolParams, newPool));
    // Token symbols is done this way to emulate multiple case. Single case will be removed shortly
    let tokenSymbols = [];
    tokenSymbols.push(`${metaData.symbol.toLowerCase()}`);
    newPool.querySelector(".confetti-button")?.addEventListener("click", harvestSingle(poolParams, newPool));
    // Stake/unstake buttons
    newPool.querySelector("#stake-button")?.addEventListener("click", stakeSingle(poolParams, newPool));
    newPool.querySelector("#unstake-button")?.addEventListener("click", unstakeSingle(poolParams, newPool));
    setAllInputMaxButtonListeners(newPool);
    // Refresh every 5 seconds if it's live
    const now = Date.now() / 1000;
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
    let refreshIntervalId = -1;
    if (isDateInRange) {
        refreshIntervalId = window.setInterval(refreshPoolInfoSingle.bind(null, poolParams, newPool), refreshTime);
    }
    // Hover events
    standardHoverToDisplayExtraInfo(newPool, "total-staked");
    // standardHoverToDisplayExtraInfo(newPool, "apr")
    standardHoverToDisplayExtraInfo(newPool, "rewards-per-day");
    standardHoverToDisplayExtraInfo(newPool, "reward-tokens");
    standardHoverToDisplayExtraInfo(newPool, "unclaimed-rewards");
}
async function resetSinglePoolListener(poolParams, pool, refreshFunction, refreshIntervalId) {
    const contractParams = await poolParams.stakingContractData.getContractParams();
    let newPool = pool.cloneNode(true);
    hideAllDynamicElements(newPool);
    addFilterClasses(poolParams, newPool);
    addSinglePoolListeners(poolParams, newPool);
    if (newPool.classList.contains("inactive-pool")) {
        displayInactiveP2P3Pool(newPool);
    }
    else {
        displayActivePool(poolParams, newPool);
    }
    if (refreshIntervalId != -1) {
        clearInterval(refreshIntervalId);
        const now = Date.now() / 1000;
        const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
        refreshIntervalId = -1;
        if (isDateInRange) {
            refreshIntervalId = window.setInterval(refreshFunction.bind(null, poolParams, newPool), 5000);
        }
    }
    pool.replaceWith(newPool);
    const event = new Event('click');
    (0, document_1.qs)(".activeFilterButton").dispatchEvent(event);
}
async function resetMultiplePoolListener(poolParams, pool, refreshFunction, refreshIntervalId) {
    let newPool = pool.cloneNode(true);
    hideAllDynamicElements(newPool);
    addFilterClasses(poolParams, newPool);
    addMultiplePoolListeners(poolParams, newPool);
    if (newPool.classList.contains("inactive-pool")) {
        displayInactiveP2P3Pool(newPool);
    }
    else {
        displayActivePool(poolParams, newPool);
    }
    if (refreshIntervalId != -1) {
        clearInterval(refreshIntervalId);
        const now = Date.now() / 1000;
        const contractParams = await poolParams.stakingContractData.getContractParams();
        const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
        refreshIntervalId = -1;
        if (isDateInRange) {
            refreshIntervalId = window.setInterval(refreshFunction.bind(null, poolParams, newPool), 5000);
        }
    }
    pool.replaceWith(newPool);
    const event = new Event('click');
    (0, document_1.qs)(".activeFilterButton").dispatchEvent(event);
}
async function resetNFTPoolListener(poolParams, pool, refreshFunction, refreshIntervalId) {
    let newPool = pool.cloneNode(true);
    hideAllDynamicElements(newPool);
    addFilterClasses(poolParams, newPool);
    addNFTPoolListeners(poolParams, newPool);
    // For some reason, newPool.classList.contains("inactive-pool") returns false when it has that class from time to time
    // So we're putting just pool. This should make the refresh to be bad on a first scenario, but good on a second one.
    if (pool.classList.contains("inactive-pool")) {
        displayInactiveNFTPool(newPool, pool);
    }
    else {
        displayActivePool(poolParams, newPool);
    }
    if (refreshIntervalId != -1) {
        clearInterval(refreshIntervalId);
        const now = Date.now() / 1000;
        const contractParams = await poolParams.stakingContractData.getContractParams();
        const isDateInRange = contractParams.farming_start < now && now < contractParams.farming_end;
        refreshIntervalId = -1;
        if (isDateInRange) {
            refreshIntervalId = window.setInterval(refreshFunction.bind(null, poolParams, newPool), 5000);
        }
    }
    pool.replaceWith(newPool);
    // const event = new Event('click')
    // qs(".activeFilterButton").dispatchEvent(event)
}
async function addFilterClasses(poolParams, newPool) {
    // Cleaning classes in case of reset
    const classes = ["your-farms", "active-pool", "inactive-pool"];
    classes.forEach(className => newPool.classList.remove(className));
    const now = Date.now() / 1000;
    const contractParams = await poolParams.stakingContractData.getContractParams();
    // const isDateInRange = poolParams.contractParams.farming_start < now && now < poolParams.contractParams.farming_end
    const isDateInRange = now < contractParams.farming_end;
    // const poolUserStatus: PoolUserStatus|[string, string, string] = await poolParams.stakingContractData.getUserStatus()
    if (await poolParams.userHasStakedTokens()) {
        newPool.classList.add("your-farms");
    }
    if (isDateInRange) {
        newPool.classList.add("active-pool");
    }
    else {
        newPool.classList.add("inactive-pool");
    }
}
async function addPool(poolParams) {
    var genericPoolElement = (0, document_1.qs)("#generic-pool-container");
    let singlePoolParams;
    let multiplePoolParams;
    var newPool = genericPoolElement.cloneNode(true);
    newPool.setAttribute("id", poolParams.html.id.toLowerCase().replace(" ", "_"));
    newPool.classList.remove("hidden");
    newPool.classList.add("pool-container");
    addFilterClasses(poolParams, newPool);
    await addRewardTokenIcons(poolParams, newPool);
    await addTotalStakedDetail(poolParams, newPool);
    await addRewardsPerDayDetail(poolParams, newPool);
    await addRewardsTokenDetail(poolParams, newPool);
    await addUnclaimedRewardsDetail(poolParams, newPool);
    if (poolParams instanceof poolParams_1.PoolParams && poolParams.type == "single") {
        singlePoolParams = poolParams;
        await addPoolSingle(singlePoolParams, newPool);
    }
    else if (poolParams instanceof poolParamsP3_1.PoolParamsP3 && poolParams.type == "multiple") {
        multiplePoolParams = poolParams;
        await addPoolMultiple(multiplePoolParams, newPool);
    }
    else if (poolParams instanceof poolParamsNFT_1.PoolParamsNFT && poolParams.type == "nft") {
        await addNFTPool(poolParams, newPool);
    }
    addPoolTokensDescription(newPool, poolParams);
    // New code
    let showContractStart = newPool.querySelector("#contract-start");
    let showContractEnd = newPool.querySelector("#contract-end");
    const contractParams = await poolParams.stakingContractData.getContractParams();
    const accountRegistered = contractParams.accounts_registered;
    newPool.querySelector(".accounts-registered-value-usd").innerHTML = `${accountRegistered} accounts`;
    showContractStart.innerHTML = new Date(contractParams.farming_start * 1000).toLocaleString();
    showContractEnd.innerHTML = new Date(contractParams.farming_end * 1000).toLocaleString();
    const poolName = await poolParams.getPoolName();
    newPool.querySelectorAll(".token-name").forEach(element => {
        element.innerHTML = poolName;
    });
    if (newPool.classList.contains("inactive-pool")) {
        displayInactiveP2P3Pool(newPool);
    }
    else {
        await displayActivePool(poolParams, newPool);
    }
    // await addTotalFarmedDetail(poolParams, newPool)
    let unixTimestamp = new Date().getTime() / 1000;
    // const isDateInRange = contractParams.farming_start < unixTimestamp && unixTimestamp < contractParams.farming_end
    const isDateInRange = unixTimestamp < contractParams.farming_end;
    setDateInRangeVisualIndication(poolParams, newPool, isDateInRange);
    (0, document_1.qs)("#pool_list").append(newPool);
    newPool.querySelector(".deposit-fee-value").innerHTML = (contractParams.fee_rate) ? contractParams.fee_rate / 100 + "%" : "0%";
    poolParams.confettiButton = new new_confetti_button_1.ConfettiButton(newPool);
    poolParams.confettiButton.render(poolParams.confettiButton.confettiButton, poolParams.confettiButton.canvas, poolParams.confettiButton.confetti, poolParams.confettiButton.sequins);
    let harvestedSuccesfully = sessionStorage.getItem("cheddarFarmHarvestedSuccesfully");
    if (harvestedSuccesfully != null) {
        let isUserFarming = newPool.classList.contains("your-farms");
        // console.log("isUserFarming", isUserFarming)
        isUserFarming && showSuccessOnHarvestAnimation(newPool, poolParams);
    }
}
function showSuccessOnHarvestAnimation(newPool, poolParams) {
    let poolID = newPool.id;
    let harvestedPoolID = sessionStorage.getItem("cheddarFarmJustHarvested");
    // console.log("poolID", poolID)
    // console.log("harvestedPoolID", harvestedPoolID)
    if (poolID == harvestedPoolID) {
        while (document.readyState != "complete") {
            setTimeout(() => {
            }, 1000);
        }
        poolParams.confettiButton?.successAnimation();
        sessionStorage.removeItem("cheddarFarmJustHarvested");
        sessionStorage.removeItem("cheddarFarmHarvestedSuccesfully");
    }
}
function displayInactiveP2P3Pool(newPool) {
    const isUserFarming = newPool.classList.contains("your-farms");
    if (isUserFarming) {
        toggleStakeUnstakeSection(newPool);
        setUnstakeTabListeners(newPool);
        newPool.querySelector(".harvest-section").classList.remove("hidden");
        newPool.querySelector("#staking-unstaking-container .staking").setAttribute("disabled", "disabled");
        const event = new Event("click");
        newPool.querySelector("#staking-unstaking-container .unstaking").dispatchEvent(event);
    }
}
function displayInactiveNFTPool(newPool, pool) {
    const isUserFarming = pool.classList.contains(`your-farms`);
    if (isUserFarming) {
        newPool.querySelector("#stake-unstake-nft").classList.remove("hidden");
        newPool.querySelector(".harvest-section").classList.remove("hidden");
    }
}
function toggleStakeUnstakeSection(newPool) {
    let expandPoolButton = newPool.querySelector(".expand-button");
    let poolContainer = newPool.querySelector("#pool-container");
    expandPoolButton.classList.remove("hidden");
    toggleExpandStakeUnstakeSection(newPool, poolContainer);
    toggleExpandStakeUnstakeSection(newPool, expandPoolButton);
}
function setUnstakeTabListeners(newPool) {
    let stakeTabButton = newPool.querySelector(".staking");
    let unstakeTabButton = newPool.querySelector(".unstaking");
    let staking = newPool.querySelector(".main-stake");
    let unstaking = newPool.querySelector(".main-unstake");
    let stakeButton = newPool.querySelector("#stake-button");
    let unstakeButton = newPool.querySelector("#unstake-button");
    unstakeTabButton.addEventListener("click", showElementHideAnother(unstaking, staking));
    unstakeTabButton.addEventListener("click", showElementHideAnother(unstakeButton, stakeButton));
    unstakeTabButton.addEventListener("click", setActiveColor);
    unstakeTabButton.addEventListener("click", cancelActiveColor(stakeTabButton));
}
function displayIfNftPool(newPool, isAccountRegistered, hasUserStaked) {
    if (isAccountRegistered) {
        // if the pool has ended and user doesn't has any NFT staked don't show the stake/unstake btn
        if (newPool.classList.contains("inactive-pool") && !hasUserStaked) {
            return;
        }
        let stakeUnstakeNftButton = newPool.querySelector("#stake-unstake-nft");
        stakeUnstakeNftButton.classList.remove("hidden");
    }
}
function displayIfTokenPool(newPool, isAccountRegistered) {
    if (isAccountRegistered) {
        toggleStakeUnstakeSection(newPool);
        let stakeTabButton = newPool.querySelector(".staking");
        let unstakeTabButton = newPool.querySelector(".unstaking");
        let staking = newPool.querySelector(".main-stake");
        let unstaking = newPool.querySelector(".main-unstake");
        let stakeButton = newPool.querySelector("#stake-button");
        let unstakeButton = newPool.querySelector("#unstake-button");
        setUnstakeTabListeners(newPool);
        stakeTabButton.addEventListener("click", showElementHideAnother(staking, unstaking));
        stakeTabButton.addEventListener("click", showElementHideAnother(stakeButton, unstakeButton));
        stakeTabButton.addEventListener("click", setActiveColor);
        stakeTabButton.addEventListener("click", cancelActiveColor(unstakeTabButton));
    }
}
async function displayActivePool(poolParams, newPool) {
    let activateButtonContainer = newPool.querySelector("#activate");
    let activateButton = newPool.querySelector(".activate");
    let harvestSection = newPool.querySelector(".harvest-section");
    if (exports.wallet != disconnected_wallet_1.disconnectedWallet) {
        let isAccountRegistered = (await poolParams.stakingContractData.contract.storageBalance()) != null;
        if (!isAccountRegistered) {
            activateButtonContainer.classList.remove("hidden");
            activateButton.addEventListener("click", activateClicked(poolParams, newPool));
            if (poolParams.html.formId == "nearcon" || poolParams.html.formId == "cheddar") {
                let warningText = "ONLY ACTIVATE IF PREVIOUSLY STAKED<br>0.06 NEAR storage deposit, gets refunded.";
                newPool.querySelector("#depositWarning").innerHTML = warningText;
            }
        }
        if (poolParams instanceof poolParams_1.PoolParams || poolParams instanceof poolParamsP3_1.PoolParamsP3) {
            displayIfTokenPool(newPool, isAccountRegistered);
        }
        else if (poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
            const poolUserStatus = await poolParams.stakingContractData.getUserStatus();
            // check for user stake 
            const hasUserStakedNFT = poolUserStatus.stake_tokens.some(total => total.length > 0) && poolUserStatus.stake != "0";
            displayIfNftPool(newPool, isAccountRegistered, hasUserStakedNFT);
        }
    }
    const isUserFarming = newPool.classList.contains("your-farms");
    if (isUserFarming) {
        activateButtonContainer.classList.add("hidden");
        activateButton.setAttribute("disabled", "disabled");
        harvestSection.classList.remove("hidden");
    }
}
function addLogo(metaData, container, index = 0) {
    let newTokenLogoElement;
    if (metaData.icon != null && metaData.icon != '') {
        // inputLogoContainer.innerHTML= `${metaData.icon}`
        if (metaData.icon.startsWith("data:image")) { // icon is img
            const tokenLogoElement = (0, document_1.qs)(".generic-token-logo-img");
            newTokenLogoElement = tokenLogoElement.cloneNode(true);
            newTokenLogoElement?.setAttribute("src", metaData.icon);
        }
        else if (metaData.icon.startsWith("<svg")) { // icon is svg tag
            const tokenLogoElement = (0, document_1.qs)(".generic-token-logo-svg-container");
            newTokenLogoElement = tokenLogoElement.cloneNode(true);
            newTokenLogoElement.innerHTML = metaData.icon;
        }
        else { // Should never happen
            const tokenLogoElement = (0, document_1.qs)(".generic-token-logo-text");
            newTokenLogoElement = tokenLogoElement.cloneNode(true);
            newTokenLogoElement.innerHTML = `${metaData.name}`;
        }
    }
    else { // Logo is not loaded (for afi-tt)
        const tokenLogoElement = (0, document_1.qs)(".generic-token-logo-text");
        newTokenLogoElement = tokenLogoElement.cloneNode(true);
        newTokenLogoElement.innerHTML = `${metaData.name}`;
    }
    toggleGenericClass(newTokenLogoElement);
    newTokenLogoElement.classList.add(`farmed-token-logo`);
    container.append(newTokenLogoElement);
}
async function addRewardTokenIcons(poolParams, newPool) {
    const tokenIconDataArray = await poolParams.getRewardTokenIconData();
    const container = newPool.querySelector(".reward-tokens-value-usd");
    for (let i = 0; i < tokenIconDataArray.length; i++) {
        const tokenIconData = tokenIconDataArray[i];
        var newMiniIcon = importMiniIcon(tokenIconData);
        container.append(newMiniIcon);
    }
}
async function addTotalStakedDetail(poolParams, newPool) {
    const stakeTokenDataArray = await poolParams.getStakeTokensDetail();
    let totalStakedRows = {
        parentClass: "total-staked-info-container",
        rows: []
    };
    for (let i = 0; i < stakeTokenDataArray.length; i++) {
        let stakeTokenData = stakeTokenDataArray[i];
        const row = {
            iconData: stakeTokenData.iconData,
            content: stakeTokenData.content
        };
        totalStakedRows.rows.push(row);
    }
    addDetailRows(newPool, totalStakedRows);
}
async function addRewardsPerDayDetail(poolParams, newPool) {
    convertAndAddRewardDataRows(poolParams, newPool, "rewards-per-day-info-container", "rewardsPerDay");
}
// async function addTotalFarmedDetail(poolParams: PoolParams|PoolParamsP3, newPool: HTMLElement) {
//   convertAndAddRewardDataRows(poolParams, newPool, "apr-info-container", "totalRewards")
// }
async function convertAndAddRewardDataRows(poolParams, newPool, parentClass, key) {
    const rewardsTokenDataArray = await poolParams.getRewardsTokenDetail();
    let rewardsPerDayRows = {
        parentClass,
        rows: []
    };
    for (let i = 0; i < rewardsTokenDataArray.length; i++) {
        let rewardsTokenData = rewardsTokenDataArray[i];
        const row = {
            iconData: rewardsTokenData.iconData,
            // @ts-ignore
            content: rewardsTokenData[key]
        };
        rewardsPerDayRows.rows.push(row);
    }
    addDetailRows(newPool, rewardsPerDayRows);
}
async function addRewardsTokenDetail(poolParams, newPool) {
    convertAndAddRewardDataRows(poolParams, newPool, "reward-tokens-info-container", "tokenName");
}
function addDetailRows(newPool, rowsData) {
    const parentElement = newPool.querySelector(`.${rowsData.parentClass}`);
    const genericRow = (0, document_1.qs)(`.generic-detail-row`);
    const rows = rowsData.rows;
    for (let i = 0; i < rows.length; i++) {
        const newRow = genericRow.cloneNode(true);
        let row = rows[i];
        newRow.querySelector(".content").innerHTML = row.content;
        const iconContainer = newRow.querySelector(".icon");
        var newMiniIcon = importMiniIcon(row.iconData);
        iconContainer.append(newMiniIcon);
        toggleGenericClass(newRow);
        newRow.classList.add(row.iconData.tokenName.toLowerCase().replace(/ /g, "-"));
        parentElement.append(newRow);
    }
}
async function addUnclaimedRewardsDetail(poolParams, newPool) {
    convertAndAddRewardDataRows(poolParams, newPool, "unclaimed-rewards-info-container", "userUnclaimedRewards");
}
function importMiniIcon(iconData) {
    const iconNode = (0, document_1.qs)(".generic-mini-icon");
    var parser = new DOMParser();
    var newMiniIcon;
    if (iconData.isSvg) {
        var doc = parser.parseFromString(iconData.src, "image/svg+xml");
        newMiniIcon = doc.documentElement;
        newMiniIcon.classList.add("generic-mini-icon");
    }
    else {
        newMiniIcon = iconNode.cloneNode(true);
        newMiniIcon.setAttribute("src", iconData.src);
        newMiniIcon.setAttribute("alt", iconData.tokenName);
    }
    // toggleGenericClass(newMiniIcon, "mini-icon")
    toggleGenericClass(newMiniIcon);
    return newMiniIcon;
}
// function toggleGenericClass(element: HTMLElement, className: string) {
//   element.classList.remove(`generic-${className}`)
//   element.classList.add(`${className}`)
//   element.classList.remove("hidden")
// }
function toggleGenericClass(element) {
    for (let i = 0; i < element.classList.length; i++) {
        let className = element.classList[i];
        if (className.includes("generic-")) {
            const newClass = className.substring("generic-".length);
            element.classList.remove(`${className}`);
            element.classList.add(`${newClass}`);
        }
    }
    element.classList.remove("hidden");
}
function setAllInputMaxButtonListeners(newPool) {
    const inputContainerArray = newPool.querySelectorAll(".token-input-container");
    for (let i = 0; i < inputContainerArray.length; i++) {
        let inputContainer = inputContainerArray[i];
        const maxButton = inputContainer.querySelector(".max-button");
        maxButton?.addEventListener("click", inputMaxButtonClicked(inputContainer));
    }
}
function inputMaxButtonClicked(newInputContainer) {
    return function (event) {
        event.preventDefault();
        let input = newInputContainer.querySelector("input");
        const amount = newInputContainer.querySelector(".value").innerHTML;
        const inputEvent = new Event("input");
        input.value = amount.toString();
        input.dispatchEvent(inputEvent);
    };
}
async function addPoolList(poolList) {
    (0, document_1.qs)("#pool_list").innerHTML = "";
    for (let i = 0; i < poolList.length; i++) {
        await addPool(poolList[i]);
    }
    (0, document_1.qs)("#pool_list").style.display = "grid";
    if ((0, document_1.qs)("#pool_list").childElementCount == 0) {
        (0, document_1.qs)("#pool_list").innerHTML = `<h2 class="no-pools">New Pools SoonTM...⚙️ Try our games!🕹️</h2>`;
    }
    // qs(".loader").style.display = "none"
    isPaused = false;
}
let closePublicityButton = (0, document_1.qs)(".close-publicity");
function closePublicityButtonHandler() {
    return function () {
        closePublicityButton.classList.add("hidden");
        let publicityContainer = (0, document_1.qs)(".publicity-container");
        publicityContainer.classList.add("hidden");
        let publicityDecoration = (0, document_1.qs)(".publicity-decoration");
        publicityDecoration.classList.add("no-publicity-position");
        let header = (0, document_1.qs)("header");
        header.classList.add("no-publicity-position");
        let burguer = (0, document_1.qs)("#burguer");
        burguer.classList.add("no-publicity-position");
    };
}
function setCountdown() {
    var countDownDate = new Date("Aug 22, 2022 12:00:00 UTC");
    var countDownDate = new Date(countDownDate.getTime() - countDownDate.getTimezoneOffset() * 60000);
    // Time calculations for days, hours, minutes and seconds
    var d = new Date();
    var d = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    var distance = countDownDate.getTime() - d.getTime();
    if (distance < 0) {
        clearInterval(countDownIntervalId);
        document.getElementById("timer").innerHTML = "";
    }
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    document.getElementById("timer").innerHTML = `<h2><span style='color:#222'>New Pools Start In: </span><span style='color:rgba(80,41,254,0.88)'>${days} d : ${hours} h :  
  ${minutes} m : ${seconds} s</span></h2>`;
}
window.onload = async function () {
    try {
        let env = config_1.ENV; //default
        if (env != exports.nearConfig.networkId)
            exports.nearConfig = (0, config_1.getConfig)(config_1.ENV);
        exports.near = await nearAPI.connect(Object.assign({
            deps: {
                keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()
            }
        }, exports.nearConfig));
        closePublicityButton.addEventListener("click", closePublicityButtonHandler());
        //Path tag is part of the svg tag and also need the event
        closePublicityButton.querySelector("path").addEventListener("click", closePublicityButtonHandler());
        let headerCheddarValueDisplayerContainer = (0, document_1.qs)(".header-extension_cheddar-value");
        let cheddarValue = Number((await (0, oracle_1.getTokenData)("cheddar")).price).toFixed(7);
        headerCheddarValueDisplayerContainer.innerHTML = `$ ${cheddarValue}`;
        // initButton()
        // countDownIntervalId = window.setInterval(function(){
        //   setCountdown()
        // }, 1000);
        //init narwallets listeners
        narwallets_1.narwallets.setNetwork(exports.nearConfig.networkId); //tell the wallet which network we want to operate on
        (0, narwallets_1.addNarwalletsListeners)(narwalletConnected, narwalletDisconnected); //listen to narwallets events
        //set-up auto-refresh loop (10 min)
        setInterval(autoRefresh, 10 * MINUTES);
        //check if signed-in with NEAR Web Wallet
        await initNearWebWalletConnection();
        let didJustActivate = false;
        (0, liquidityButton_1.initButton)();
        const cheddarContractName = (config_1.ENV == 'mainnet') ? config_1.CHEDDAR_CONTRACT_NAME : config_1.TESTNET_CHEDDAR_CONTRACT_NAME;
        const cheddarContract = new NEP141_1.NEP141Trait(cheddarContractName);
        let circulatingSupply = await cheddarContract.ft_total_supply();
        let allSuplyTextContainersToFill = document.querySelector(".circulatingSupply.supply");
        allSuplyTextContainersToFill.innerHTML = (0, conversions_1.toStringDec)((0, conversions_1.yton)(circulatingSupply)).split('.')[0];
        if (nearWebWalletConnection.isSignedIn()) {
            //already signed-in with NEAR Web Wallet
            //make the contract use NEAR Web Wallet
            exports.wallet = new near_web_wallet_1.NearWebWallet(nearWebWalletConnection);
            // const poolList = await getPoolList(wallet)
            // await addPoolList(poolList)
            accountName = exports.wallet.getAccountId();
            (0, document_1.qsInnerText)("#account-id", accountName);
            await signedInFlow(exports.wallet);
            cheddarContract.wallet = exports.wallet;
            const cheddarBalance = await cheddarContract.ft_balance_of(accountName);
            const amountAvailable = (0, conversions_1.toStringDec)((0, conversions_1.yton)(await exports.wallet.getAccountBalance()));
            (0, document_1.qsInnerText)("#my-account #wallet-available", amountAvailable);
            (0, document_1.qsInnerText)("#my-account #cheddar-balance", (0, conversions_1.convertToDecimals)(cheddarBalance, 24, 5));
            (0, document_1.qsInnerText)("#nft-pools-section .cheddar-balance-container .cheddar-balance", (0, conversions_1.convertToDecimals)(cheddarBalance, 24, 5));
            //check if we're re-spawning after a wallet-redirect
            //show transaction result depending on method called
            const searchParamsResultArray = await (0, checkRedirectSearchParams_1.checkRedirectSearchParamsMultiple)(nearWebWalletConnection, exports.nearConfig.explorerUrl || "explorer");
            let method = "";
            let err;
            let args = [];
            searchParamsResultArray.forEach(searchParamsResult => {
                const { err: errResult, data, method: methodResult, finalExecutionOutcome } = searchParamsResult;
                if (errResult) {
                    err = errResult;
                    return;
                }
                if (methodResult) {
                    method = methodResult;
                }
                if (finalExecutionOutcome) {
                    let arg = JSON.parse(atob(finalExecutionOutcome.transaction.actions[0].FunctionCall.args));
                    if (arg.token == undefined) {
                        const stakeContract = finalExecutionOutcome.transaction.receiver_id;
                        for (let i = 0; i < exports.nearConfig.farms.length; i++) {
                            const farmData = exports.nearConfig.farms[i];
                            if (farmData.contractName == stakeContract) {
                                arg.token = farmData.tokenContractName;
                                break;
                            }
                        }
                    }
                    args.push(arg);
                }
            });
            if (err) {
                (0, document_1.showError)(err, "Transaction - " + method || "");
            }
            else if (method == "ft_transfer_call") {
                // @ts-ignore
                await stakeResult(args);
            }
            else if (method == "unstake") {
                // @ts-ignore
                await unstakeResult(args);
            }
            else if (method == "nft_transfer_call") {
                (0, document_1.showSuccess)("NFT staked successfully", "Stake NFT");
                // @ts-ignore
                // await nftStakeResult(args)
            }
            else if (method == "storage_deposit") {
                didJustActivate = true;
                (0, document_1.showSuccess)("Successfully activated", "Activate");
            }
            else if (method == "withdraw_crop") {
                window.sessionStorage.setItem("cheddarFarmHarvestedSuccesfully", "yes");
                (0, document_1.showSuccess)("Tokens harvested successfully");
            }
            else {
                console.log("Method", method);
                console.log("Args", args.join("\n"));
            }
        }
        else {
            //not signed-in 
            await signedOutFlow(); //show home-not-connected -> select wallet page
        }
        const poolList = await (0, poolList_1.getPoolList)(exports.wallet);
        await addPoolList(poolList);
        setDefaultFilter(didJustActivate);
    }
    catch (ex) {
        (0, document_1.showErr)(ex);
    }
    finally {
        (0, document_1.qs)(".loader").style.display = "none";
    }
};
async function stakeResult(argsArray) {
    let message = "Staked: ";
    let tokensStakedMessage = [];
    const poolList = await (0, poolList_1.getPoolList)(exports.wallet);
    let pool;
    for (let i = 0; i < poolList.length; i++) {
        if (argsArray[0].receiver_id == poolList[i].stakingContractData.contract.contractId) {
            pool = poolList[i];
            break;
        }
    }
    if (!pool) {
        throw new Error(`No pool found with contract id ${argsArray[0].receiver_id}`);
    }
    await Promise.all(argsArray.map(async (args, index) => {
        // const args = JSON.parse(atob(finalExecutionOutcome.transaction.actions[0].FunctionCall.args))
        let metadata;
        if (pool instanceof poolParams_1.PoolParams) {
            metadata = await pool.stakeTokenContract.ft_metadata();
        }
        else if (pool instanceof poolParamsP3_1.PoolParamsP3) {
            const stakeTokenContractList = await pool.stakingContractData.getStakeTokenContractList();
            metadata = await stakeTokenContractList[index].contract.ft_metadata();
        }
        if (!metadata) {
            // This if should never be true
            throw new Error("Error obtaining metadata on stake result");
        }
        const amount = (0, conversions_1.convertToDecimals)(args.amount, metadata.decimals, 5);
        tokensStakedMessage.push(`${amount} ${metadata.symbol}`);
    }));
    message += tokensStakedMessage.join(" - ");
    (0, document_1.showSuccess)(message, "Stake");
}
async function unstakeResult(argsArray) {
    let message = "Unstaked: ";
    if ("nft_contract_id" in argsArray[0]) {
        message += `deposited cheddar and ${argsArray.length} NFTs have been refunded`;
    }
    else if ("token" in argsArray[0]) {
        let tokensUnstakedMessage = [];
        for (let i = 0; i < argsArray.length; i++) {
            const args = argsArray[i];
            let contract = new NEP141_1.NEP141Trait(args.token);
            contract.wallet = exports.wallet;
            const metaData = await contract.ft_metadata();
            // @ts-ignore
            const amount = (0, conversions_1.convertToDecimals)(args.amount, metaData.decimals, 5);
            tokensUnstakedMessage.push(`${amount} ${metaData.symbol}`);
        }
        message += tokensUnstakedMessage.join(" - ");
    }
    (0, document_1.showSuccess)(message, "Unstake");
}
// NEW CODE
function toggleActions(elementToShow) {
    return function (event) {
        let element = event.target;
        element.tagName.toLowerCase() != "a" && event.preventDefault();
        const tagName = element.tagName.toLowerCase();
        const tagsToIgnore = ["button", "input", "span", "img", "svg", "path", "a"];
        if (!tagsToIgnore.includes(tagName) || element.classList.contains("toggle-display")) {
            elementToShow.classList.toggle("hidden");
        }
    };
}
function flipElement(elementToFlip) {
    return function (event) {
        let element = event.target;
        element.tagName.toLowerCase() != "a" && event.preventDefault();
        const tagName = element.tagName.toLowerCase();
        const tagsToIgnore = ["button", "input", "span", "img", "svg", "path", "polygon", "a"];
        if (!tagsToIgnore.includes(tagName) || element.classList.contains("toggle-display")) {
            elementToFlip.classList.toggle("flipped");
        }
    };
}
function toggleElement(elementToShow) {
    return function (event) {
        event.preventDefault();
        elementToShow.classList.toggle("hidden");
    };
}
function paintOrUnPaintElement(previousColoringClass, elementToPaint) {
    return function (event) {
        event.preventDefault();
        elementToPaint.classList.toggle("transparent");
        elementToPaint.classList.toggle(previousColoringClass);
    };
}
function makeBlinkElement(elementToMakeBlink) {
    return function (event) {
        event.preventDefault();
        elementToMakeBlink.classList.toggle("blink");
    };
}
function showElement(elementToShow) {
    return function (event) {
        event.preventDefault();
        elementToShow.classList.remove("hidden");
    };
}
function hideElement(elementToHide) {
    return function (event) {
        event.preventDefault();
        elementToHide.classList.add("hidden");
    };
}
function showElementHideAnother(elementToShow, elementToHide) {
    return function (event) {
        event.preventDefault();
        elementToShow.classList.remove("hidden");
        elementToHide.classList.add("hidden");
    };
}
function setActiveColor(event) {
    let element = event.target;
    element.classList.add("active");
}
function cancelActiveColor(elementToDisplayAsNotActive) {
    return function (event) {
        event.preventDefault();
        elementToDisplayAsNotActive.classList.remove("active");
    };
}
async function loadAndShowNfts(poolParams, buttonId) {
    await loadNFTs(poolParams, buttonId);
    (0, document_1.qs)("#nft-pools-section").classList.remove("hidden");
    if (poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
        let confirmStakeUnstakeNFTButton = NFTPoolSection.querySelector("#confirm-stake-unstake");
        let cancelStakeUnstakeNFTButton = NFTPoolSection.querySelector("#cancel-stake-unstake");
        confirmStakeUnstakeNFTButton.addEventListener("click", confirmStakeUnstakeNFTButtonHandler(poolParams));
        cancelStakeUnstakeNFTButton.addEventListener("click", quitNFTFlex());
    }
}
function displayCheddarNeededToStakeNFTs(stakeRate) {
    const nftPoolSection = (0, document_1.qs)("#nft-pools-section");
    let countSelectedToStakeNfts = (nftPoolSection.querySelectorAll(".nft-card.selected.unstaked")).length;
    const amountNeededToStakeAllNfts = nftPoolSection.querySelector(".cheddar-needed-to-stake-all-nfts");
    amountNeededToStakeAllNfts.innerHTML = (countSelectedToStakeNfts * stakeRate).toString();
}
function selectAllActionNftButtons(action, stakeRate) {
    return function (event) {
        event.preventDefault();
        const nftPoolsSection = (0, document_1.qs)("#nft-pools-section");
        const allSelectedPreviously = nftPoolsSection.querySelectorAll(".selected");
        allSelectedPreviously.forEach(element => {
            element.classList.remove("selected");
        });
        const clickedElement = event.target;
        clickedElement.classList.add("selected");
        let allNFTCardsByAction;
        if (action == "stake") {
            allNFTCardsByAction = nftPoolsSection.querySelectorAll(".nft-card.unstaked");
        }
        else {
            allNFTCardsByAction = nftPoolsSection.querySelectorAll(".nft-card.staked");
        }
        allNFTCardsByAction.forEach(card => {
            card.classList.add("selected");
        });
        displayCheddarNeededToStakeNFTs(stakeRate);
    };
}
async function showStakeUnstakeNFTGrid(poolParams, buttonId) {
    const contractParams = await poolParams.stakingContractData.getContractParams();
    // const stakeRateStr: string = contractParams.stake_rates[0]    
    const stakeRate = (0, conversions_1.yton)(contractParams.cheddar_rate);
    (0, document_1.qs)(".needed-to-stake-each-nft .amount").innerHTML = stakeRate.toString();
    const multipleNftSelectionButtons = (0, document_1.qs)(".multiple-nft-selection");
    multipleNftSelectionButtons.classList.remove("hidden");
    const confirmButton = (0, document_1.qs)("#confirm-stake-unstake");
    confirmButton.classList.remove("hidden");
    const cancelButton = (0, document_1.qs)("#cancel-stake-unstake");
    cancelButton.classList.remove("hidden");
    const unstakeAllNftsButton = (0, document_1.qs)(".unstake-all-nft-button");
    unstakeAllNftsButton.addEventListener("click", selectAllActionNftButtons("unstake", stakeRate));
    const stakeAllNftsButton = (0, document_1.qs)(".stake-all-nft-button");
    stakeAllNftsButton.addEventListener("click", selectAllActionNftButtons("stake", stakeRate));
    displayCheddarNeededToStakeNFTs(stakeRate);
    await loadAndShowNfts(poolParams, buttonId);
}
function showNFTGrid(poolParams, buttonId) {
    return async function () {
        loadAndShowNfts(poolParams, buttonId);
    };
}
async function loadNFTs(poolParams, buttonId) {
    const NFTContainer = (0, document_1.qs)(".nft-flex");
    NFTContainer.innerHTML = "";
    const accountId = poolParams.wallet.getAccountId();
    let nftContract;
    let stakedOrBoostingNFTsToAdd = [];
    //Use conditional to check if the pressed button was boost or stake/unstake so the correct nft are loaded
    let userUnstakedNFTsWithMetadata = [];
    let userStatus = await poolParams.stakingContractData.getUserStatus();
    let poolHasStaked = false;
    if (buttonId === "boost-button") {
        nftContract = poolParams.nftContractForBoosting;
        const userUnstakedNFTs = await nftContract.nft_tokens_for_owner(accountId);
        const mapped = userUnstakedNFTs.map((nft) => {
            return {
                ...nft,
                contract_id: nftContract.contractId,
                base_url: nftContract.baseUrl
            };
        });
        console.log(1, mapped.length);
        userUnstakedNFTsWithMetadata = userUnstakedNFTsWithMetadata.concat(mapped);
        let tokenId;
        if ("boost_nfts" in userStatus) {
            poolHasStaked = userStatus.boost_nfts != '';
            tokenId = userStatus.boost_nfts;
        }
        else {
            poolHasStaked = userStatus.cheddy_nft != '';
            tokenId = userStatus.cheddy_nft;
        }
        // poolHasStaked = userStatus.cheddy_nft != '' || userStatus.boost_nfts != ''
        if (poolHasStaked)
            stakedOrBoostingNFTsToAdd.push((0, nft_structs_1.newNFT)(tokenId, nftContract.baseUrl, nftContract.contractId));
    }
    else if (buttonId === "stake-unstake-nft" && poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
        const nftContractList = await poolParams.stakingContractData.getStakeNFTContractList();
        for (let i = 0; i < nftContractList.length; i++) {
            const contract = nftContractList[i].contract;
            const nftMetadata = contract.nft_metadata();
            const userUnstakedNFTs = await contract.nft_tokens_for_owner(accountId);
            let baseUrl = (await nftMetadata).base_uri;
            if (!baseUrl)
                baseUrl = contract.baseUrl;
            userUnstakedNFTsWithMetadata = userUnstakedNFTsWithMetadata.concat(userUnstakedNFTs.map((nft) => {
                return {
                    ...nft,
                    contract_id: contract.contractId,
                    base_url: baseUrl
                };
            }));
        }
        poolHasStaked = userStatus.stake_tokens.some(a => a.length > 0);
        for (let index = 0; index < userStatus.stake_tokens.length; index++) {
            const contract = nftContractList[index].contract;
            let contractTokens = userStatus.stake_tokens[index];
            let thisUserStakedNFTsPromises = [];
            for (let tokenId of contractTokens) {
                thisUserStakedNFTsPromises.push(contract.nft_token(tokenId));
            }
            const thisUserStakedNFTs = await Promise.all(thisUserStakedNFTsPromises);
            thisUserStakedNFTs.forEach(nft => {
                stakedOrBoostingNFTsToAdd.push({
                    ...nft,
                    contract_id: contract.contractId,
                    base_url: contract.baseUrl
                });
            });
        }
    }
    else {
        throw new Error(`Object ${typeof poolParams} is not implemented for loading NFT's`);
    }
    if (userUnstakedNFTsWithMetadata.length == 0 && !poolHasStaked) {
        let tokenName = "";
        if (poolParams instanceof poolParamsP3_1.PoolParamsP3) {
            tokenName = "cheddar";
        }
        else {
            const nftContractList = await poolParams.stakingContractData.getStakeNFTContractList();
            // It will be assumed there is only one NFT for staking
            const nftContractMetadata = await nftContractList[0].getMetadata();
            tokenName = nftContractMetadata.name.toLowerCase();
        }
        NFTContainer.innerHTML = `You don't have any ${tokenName} NFT`;
        return;
    }
    if (stakedOrBoostingNFTsToAdd.length > 0) {
        stakedOrBoostingNFTsToAdd.forEach((nft) => {
            addNFT(poolParams, NFTContainer, nft, poolHasStaked, "", buttonId, "", true);
        });
    }
    userUnstakedNFTsWithMetadata.forEach(nft => {
        console.log(4, nft);
        addNFT(poolParams, NFTContainer, nft, poolHasStaked, "", buttonId, "", false);
    });
}
function checkIfMultipleSelectionButtonsMustBeSelected() {
    const nftPoolsSection = document.querySelector("#nft-pools-section");
    let unstakedAmount = nftPoolsSection.querySelectorAll(".unstaked").length;
    let stakedAmount = nftPoolsSection.querySelectorAll(".staked").length;
    let unstakedSelectedAmount = nftPoolsSection.querySelectorAll(".unstaked.selected").length;
    let stakedSelectedAmount = nftPoolsSection.querySelectorAll(".staked.selected").length;
    let stakeAllButton = (0, document_1.qs)(".stake-all-nft-button");
    if (unstakedAmount == unstakedSelectedAmount && unstakedAmount != 0) {
        stakeAllButton.classList.add("selected");
    }
    else {
        stakeAllButton.classList.remove("selected");
    }
    let unstakeAllButton = (0, document_1.qs)(".unstake-all-nft-button");
    if (stakedAmount == stakedSelectedAmount && stakedAmount != 0) {
        unstakeAllButton.classList.add("selected");
    }
    else {
        unstakeAllButton.classList.remove("selected");
    }
}
function stakeAndUstakeNFTButtonHandler(newNFTCard, stakeRate) {
    return function () {
        newNFTCard.classList.toggle("selected");
        checkIfMultipleSelectionButtonsMustBeSelected();
        displayCheddarNeededToStakeNFTs(stakeRate);
    };
}
function confirmStakeUnstakeNFTButtonHandler(poolParams) {
    return async function (event) {
        event.preventDefault();
        let isAnyNFTSelected = (0, document_1.qsa)(".nft-flex .selected").length > 0;
        if (!isAnyNFTSelected) {
            (0, document_1.showError)("Select NFT's to stake or unstake");
            return;
        }
        try {
            const contractParams = await poolParams.stakingContractData.getContractParams();
            //If used don´t have enough cheddar to stake all the selected NFTs show error msg and return
            let cheddarBalanceContainer = document.querySelector(".cheddar-balance");
            let cheddarBalance = parseInt(cheddarBalanceContainer.innerHTML);
            let cheddarNeededToStakeNFTsContainer = document.querySelector(".cheddar-needed-to-stake-all-nfts");
            let cheddarNeededToStakeNFTs = parseInt(cheddarNeededToStakeNFTsContainer.innerHTML);
            if (cheddarBalance < cheddarNeededToStakeNFTs) {
                (0, document_1.showError)("Not enough cheddar to stake selected NFTs");
            }
            const stakeUnstakeNFTsMap = await getNFTsToStakeAndUnstake(poolParams);
            const haveNftsToStake = Array.from(stakeUnstakeNFTsMap.values()).some((entry) => entry.nftsToStake.length > 0);
            let unixTimestamp = new Date().getTime() / 1000;
            const isDateInRange = unixTimestamp < contractParams.farming_end;
            if (!isDateInRange && haveNftsToStake)
                throw Error("Pools is Closed.");
            poolParams.stakeUnstakeNFTs(stakeUnstakeNFTsMap);
        }
        catch (err) {
            (0, document_1.showErr)(err);
        }
    };
}
async function getNFTsToStakeAndUnstake(poolParams) {
    // let nftsToStake = [] as string[]
    // let nftsToUnstake = [] as string[]
    const stakeNFTContractList = await poolParams.stakingContractData.getStakeNFTContractList();
    let output = new Map();
    stakeNFTContractList.forEach((nftContractData) => {
        const contractId = nftContractData.contract.contractId;
        output.set(contractId, {
            nftsToStake: [],
            nftsToUnstake: []
        });
    });
    let allSelectedNfts = NFTPoolSection.querySelectorAll(".nft-card.selected");
    allSelectedNfts.forEach(nft => {
        let nftNameContainer = nft.querySelector(".nft-name");
        let nftName = nftNameContainer.innerHTML;
        let thisNFTStakeButton = nft.querySelector(".stake-nft-button");
        let contractId = nft.getAttribute("contract_id");
        let contractStakeUnstakeData = output.get(contractId);
        // TODO: For some reason, this function is being called multiple times on confirm, and on some run this object is undefined
        // The next line is set to avoid an error message, but it should be reviewed why this is happening.
        // There is also some react involved for some reason. It is uncertained wheter it is called from NEAR, since this project
        // doesn't have any react code involved, and it doesn't seem to be malicious
        if (!contractStakeUnstakeData)
            return;
        //If the stake button is hidden the pool needs to be unstaked
        //If not it needs to be staked
        if (thisNFTStakeButton?.classList.contains("hidden")) {
            contractStakeUnstakeData.nftsToUnstake.push(nftName);
        }
        else {
            contractStakeUnstakeData.nftsToStake.push(nftName);
        }
    });
    return output;
}
function displayNFTPoolSectionForStakeUnstakeNFT(newNFTCard, stakeButton, unstakeButton, stakeRate) {
    const NFTStakeTitle = NFTPoolSection.querySelector(".stake-nfts-title");
    const cheddarBalanceContainer = NFTPoolSection.querySelector(".cheddar-balance-container");
    NFTStakeTitle.classList.remove("hidden");
    cheddarBalanceContainer.classList.remove("hidden");
    stakeButton.addEventListener("click", stakeAndUstakeNFTButtonHandler(newNFTCard, stakeRate));
    unstakeButton.addEventListener("click", stakeAndUstakeNFTButtonHandler(newNFTCard, stakeRate));
}
function displayNFTPoolSectionForNFTBoost(poolParams, poolHasStaked, staked, newNFTCard, i, stakeButton, unstakeButton) {
    const NFTPoolSectionInfoRow = NFTPoolSection.querySelector(".nft-farm-info");
    //Only if user have more than 1 NFT the legend "You can only boost one NFT is shown"
    if (i > 1) {
        NFTPoolSectionInfoRow.classList.remove("hidden");
    }
    stakeButton?.addEventListener("click", stakeNFT(poolParams, newNFTCard));
    if (staked) {
        unstakeButton.addEventListener("click", unstakeNFT(poolParams, newNFTCard));
    }
    if (poolHasStaked) {
        stakeButton.setAttribute("disabled", "disabled");
    }
    else {
        stakeButton.removeAttribute("disabled");
    }
}
async function addNFT(poolParams, container, nft, poolHasStaked, nftBaseUrl, buttonId, contractId, staked = false) {
    const genericNFTCard = (0, document_1.qs)(".generic-nft-card");
    const newNFTCard = genericNFTCard.cloneNode(true);
    newNFTCard.setAttribute("contract_id", nft.contract_id);
    let i = 0;
    const nftName = nft.token_id.indexOf("@") != -1 ? nft.token_id.split("@")[1] : nft.token_id;
    for (; i < newNFTCard.querySelectorAll(".nft-name").length; i++) {
        newNFTCard.querySelectorAll(".nft-name")[i].innerHTML = nftName;
    }
    const NFTPoolSectionInfoRow = NFTPoolSection.querySelector(".nft-farm-info");
    NFTPoolSectionInfoRow.classList.add("hidden");
    let imgElement = newNFTCard.querySelector(".nft-img-container img");
    // imgElement?.setAttribute("src", new URL(nft.metadata.media, nftBaseUrl).href)
    const nftMedia = nft.metadata.media.indexOf("@") != -1 ? nft.metadata.media.split("@")[1] : nft.metadata.media;
    let src;
    console.log(3, nftMedia, nft.base_url);
    if (nftMedia.startsWith("https://")) {
        src = nftMedia;
    }
    else {
        src = nft.base_url + "/" + nftMedia;
    }
    imgElement?.setAttribute("src", src);
    imgElement.setAttribute("alt", nft.metadata.media);
    let stakeButton = newNFTCard.querySelector(".stake-nft-button");
    let unstakeButton = newNFTCard.querySelector(".unstake-nft-button");
    if (staked) {
        unstakeButton.classList.remove("hidden");
        stakeButton.classList.add("hidden");
        if (buttonId == "stake-unstake-nft") {
            newNFTCard.classList.add("staked");
            newNFTCard.classList.remove("unstaked");
        }
    }
    else {
        unstakeButton.classList.add("hidden");
        stakeButton.classList.remove("hidden");
        if (buttonId == "stake-unstake-nft") {
            newNFTCard.classList.add("unstaked");
            newNFTCard.classList.remove("staked");
        }
    }
    if (buttonId === "boost-button") {
        displayNFTPoolSectionForNFTBoost(poolParams, poolHasStaked, staked, newNFTCard, i, stakeButton, unstakeButton);
    }
    else if (buttonId === "stake-unstake-nft" && poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
        const contractParams = await poolParams.stakingContractData.getContractParams();
        const stakeRate = (0, conversions_1.yton)(contractParams.cheddar_rate);
        displayNFTPoolSectionForStakeUnstakeNFT(newNFTCard, stakeButton, unstakeButton, stakeRate);
    }
    container.append(newNFTCard);
    toggleGenericClass(newNFTCard);
}
function stakeNFT(poolParams, card) {
    return async function (event) {
        try {
            event.preventDefault();
            (0, document_1.showWait)("Staking NFT...");
            const tokenId = card.querySelector(".nft-name").innerHTML;
            await poolParams.nftContractForBoosting.nft_transfer_call(poolParams.stakingContractData.contract.contractId, tokenId);
            (0, document_1.showSuccess)("NFT staked successfully");
            let allNFTCards = (0, document_1.qsa)(".nft-card");
            allNFTCards.forEach(NFTCard => {
                NFTCard.querySelector(".stake-nft-button").setAttribute("disabled", "disabled");
            });
            card.querySelector(".stake-nft-button").classList.add("hidden");
            let unstakeButton = card.querySelector(".unstake-nft-button");
            unstakeButton.removeAttribute("disabled");
            unstakeButton.addEventListener("click", unstakeNFT(poolParams, card));
        }
        catch (err) {
            (0, document_1.showErr)(err);
        }
    };
}
function unstakeNFT(poolParams, card) {
    return async function (event) {
        try {
            event.preventDefault();
            (0, document_1.showWait)("Unstaking NFT...");
            if (poolParams instanceof poolParamsP3_1.PoolParamsP3) {
                await poolParams.stakingContractData.contract.withdraw_nft(poolParams.wallet.getAccountId());
            }
            else if (poolParams instanceof poolParamsNFT_1.PoolParamsNFT) {
                await poolParams.withdrawBoost();
            }
            (0, document_1.showSuccess)("NFT unstaked successfully");
            card.querySelector(".unstake-nft-button").classList.add("hidden");
            (0, document_1.qsa)(".stake-nft-button").forEach(elem => {
                elem.removeAttribute("disabled");
                elem.classList.remove("hidden");
            });
            // let stakeButton = card.querySelector(".stake-nft-button")!
            // stakeButton.removeAttribute("disabled")
            // stakeButton.addEventListener("click", stakeNFT(poolParams, card))
        }
        catch (err) {
            (0, document_1.showErr)(err);
        }
    };
}
function hideNFTFlexComponents() {
    const hideNFTFlexComponents = NFTPoolSection.querySelectorAll(".hiddenByDefault");
    for (let i = 0; i < hideNFTFlexComponents.length; i++) {
        hideNFTFlexComponents[i].classList.add("hidden");
    }
}
function showNFTFlexComponents() {
    const showNFTFlexComponents = NFTPoolSection.querySelectorAll(".shownUnselectedByDefault");
    for (let i = 0; i < showNFTFlexComponents.length; i++) {
        showNFTFlexComponents[i].classList.remove("selected");
    }
}
function quitNFTFlex() {
    return function (event) {
        event.preventDefault();
        let element = event.target;
        if (element.getAttribute("id") == "nft-pools-section" || element.getAttribute("id") == "cancel-stake-unstake") {
            (0, document_1.qs)(".nft-flex").innerHTML = "";
            (0, document_1.qs)("#nft-pools-section").classList.add("hidden");
            hideNFTFlexComponents();
            showNFTFlexComponents();
        }
    };
}
const NFTPoolSection = (0, document_1.qs)("#nft-pools-section");
NFTPoolSection.addEventListener("click", quitNFTFlex());
//Burger button
const burgerTogglers = (0, document_1.qsa)(".toggleBurguer");
burgerTogglers.forEach(toggler => {
    toggler.addEventListener('click', () => {
        toggleBurgerNav();
    });
});
const toggleBurgerNav = () => {
    const burgerButton = (0, document_1.qs)(".burger-button");
    const rightNav = (0, document_1.qs)('.burguer-content');
    rightNav.classList.toggle('show-right__nav');
    burgerButton.classList.toggle('burger-button--toggle');
};
