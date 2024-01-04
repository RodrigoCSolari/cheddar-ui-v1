"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showErr = exports.showError = exports.showSuccess = exports.showMessage = exports.hideWaitKeepOverlay = exports.showWait = exports.hideOverlay = exports.hidePopup = exports.showPopup = exports.hide = exports.show = exports.qsInnerText = exports.qsaAttribute = exports.qsaInnerText = exports.qsa = exports.qsi = exports.qs = void 0;
// document.querySelector shortcuts
// qs => document.querySelector ->  HTMLElement
function qs(selector) { return document.querySelector(selector); }
exports.qs = qs;
// qsi => document.querySelector ->  HTMLInputElement
function qsi(selector) { return document.querySelector(selector); }
exports.qsi = qsi;
// qsa => document.querySelectorAll ->  NodeListOf<Element>
function qsa(selector) { return document.querySelectorAll(selector); }
exports.qsa = qsa;
///set innerText for all matching HTMLElements
function qsaInnerText(selector, innerText) {
    document.querySelectorAll(selector).forEach(e => {
        if (e instanceof HTMLElement)
            e.innerText = innerText;
    });
}
exports.qsaInnerText = qsaInnerText;
///set innerText for all matching HTMLElements
function qsaAttribute(selector, attributeKey, attributeValue) {
    document.querySelectorAll(selector).forEach(e => {
        if (e instanceof HTMLElement)
            e.setAttribute(attributeKey, attributeValue);
    });
}
exports.qsaAttribute = qsaAttribute;
///set innerText for first matching HTMLElement
function qsInnerText(selector, innerText) {
    document.querySelector(selector).innerHTML = innerText;
}
exports.qsInnerText = qsInnerText;
function show(el, onOff = true) {
    el.style.display = (onOff ? "" : "none");
}
exports.show = show;
function hide(el) {
    el.style.display = "none";
}
exports.hide = hide;
function showPopup(selector, msg, title) {
    cancelWait = true;
    const el = qs(selector);
    const overlay = qs("#overlay1");
    //hide all
    overlay.querySelectorAll(".box.popup").forEach(hide);
    //show required
    //get children by id
    const titleElem = el.querySelector("#title");
    const msgElem = el.querySelector("#msg");
    if (msgElem && msg)
        msgElem.innerHTML = msg;
    if (titleElem && title)
        titleElem.innerText = title;
    show(el);
    //show overlay
    show(overlay);
}
exports.showPopup = showPopup;
function hidePopup(selector) {
    hide(qs(selector));
}
exports.hidePopup = hidePopup;
function hideOverlay() {
    cancelWait = true;
    hide(qs("#overlay1"));
}
exports.hideOverlay = hideOverlay;
let waitStartTimer;
let cancelWait = false;
function showWait(msg, title) {
    cancelWait = false;
    waitStartTimer = setTimeout(() => {
        if (!cancelWait)
            showPopup("#wait-box", msg, title);
    }, 500);
}
exports.showWait = showWait;
function hideWaitKeepOverlay() {
    cancelWait = true;
    if (waitStartTimer) {
        clearTimeout(waitStartTimer);
        waitStartTimer = undefined;
    }
    hidePopup("#wait-box");
}
exports.hideWaitKeepOverlay = hideWaitKeepOverlay;
function showMessage(msg, title) {
    showPopup("#message-box", msg, title);
}
exports.showMessage = showMessage;
function showSuccess(msg, title) {
    console.log(msg + " " + title);
    showPopup("#success-box", msg, title);
}
exports.showSuccess = showSuccess;
function showError(msg, title) {
    title = (msg == "Error from wallet: userRejected") ? "Transaction Rejected" : title;
    showPopup("#error-box", msg, title);
}
exports.showError = showError;
function showErr(ex) {
    console.log(ex);
    showError(ex.message);
}
exports.showErr = showErr;
