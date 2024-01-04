"use strict";
//----------------------------------
//------ conversions YoctoNEAR <-> Near
//----------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommas = exports.toStringDecMin = exports.removeDecZeroes = exports.toStringDec = exports.bigintToStringDecLong = exports.toStringDecLong = exports.toStringDecSimple = exports.toNumber = exports.convertToBase = exports.convertToDecimals = exports.ytonFull = exports.ytonLong = exports.yton = exports.ntoy = exports.TGas = void 0;
//BigInt scientific notation
const base1e = BigInt(10);
function b1e(n) { return base1e ** BigInt(n); }
;
const b1e12 = b1e(12);
const b1e24 = b1e(24);
const b1e18 = b1e(18);
//TGas number -> U64String
function TGas(tgas) {
    return (BigInt(tgas) * b1e12).toString(); // tgas*1e12 // Note: gas is u64
}
exports.TGas = TGas;
//NEAR amount (up-to 6 dec points) -> U128String yoctoNEAR
function ntoy(near) {
    return (BigInt(Math.round(near * 1e6)) * b1e18).toString(); // near*1e24 // Note: YoctoNear is u128
}
exports.ntoy = ntoy;
//yoctoNEAR amount -> number, rounded
/**
 * returns Near number with 5 decimal digits
 * @param {string} yoctoNEAR amount
 */
function yton(yoctos) {
    try {
        yoctos = yoctos.toString();
        if (yoctos == undefined)
            return 0;
        const decimals = 5;
        const bn = BigInt(yoctos) + BigInt(0.5 * 10 ** (24 - decimals)); //round 6th decimal
        const truncated = ytonFull(bn.toString()).slice(0, (decimals - 24));
        return Number(truncated);
    }
    catch (ex) {
        console.log("ERR: yton(", yoctos, ")", ex);
        return NaN;
    }
}
exports.yton = yton;
//yoctoNEAR amount -> number, rounded
/**
 * returns Near number with 5 decimal digits
 * @param {string} yoctoNEAR amount
 */
function ytonLong(yoctos) {
    try {
        if (yoctos == undefined)
            return 0;
        const decimals = 8;
        const bn = BigInt(yoctos) + BigInt(0.5 * 10 ** (24 - decimals)); //round 6th decimal
        const truncated = ytonFull(bn.toString()).slice(0, (decimals - 24));
        return Number(truncated);
    }
    catch (ex) {
        console.log("ERR: yton(", yoctos, ")", ex);
        return NaN;
    }
}
exports.ytonLong = ytonLong;
/**
 * returns string with a decimal point and 24 decimal places
 * @param {string} yoctoString amount in yoctos
 */
function ytonFull(yoctoString) {
    let result = (yoctoString + "").padStart(25, "0");
    result = result.slice(0, -24) + "." + result.slice(-24);
    return result;
}
exports.ytonFull = ytonFull;
//-------------------------------------
//--- conversions User-input <-> Number
//-------------------------------------
/** rebase a number based on decimal. Examples
*   convertToDecimals("1",3) = 0.001
*   convertToDecimals("0",3) = 0.0
*   convertToDecimals("1000",3) = 1.0
*   convertToDecimals("1000",3) = 1.0
*   convertToDecimals("12345678",3) = 123.45678
*   If truncate is provided, then the fractional part of the number is truncated to the
*   `truncate` decimal digits. If `truncate == 0` then the fractional part is ommited.
*   Example:
*   convertToDecimals("12345678", 1, 1) = 123.4
*/
function convertToDecimals(str, decimals, truncate) {
    str = str.toString(); // convert numbers and bigint
    // clear leading zeros
    let i = 0;
    for (; i < str.length && str[i] == "0"; ++i) { }
    if (i != 0)
        str = str.substring(i);
    if (str == "0")
        return "0";
    // let decimals_n = Number(decimals);
    if (decimals == 0)
        return str;
    // Pad zeros at the beginning.
    // We add 1 to make sure the integer digit is included as well)
    str = String(str).padStart(decimals + 1, "0");
    let integer = str.slice(0, -decimals);
    let fractional = str.slice(integer.length);
    if (integer == "")
        integer = "0";
    if (fractional == "")
        return integer;
    if (truncate == undefined) {
        return integer + "." + fractional;
    }
    else if (Number(fractional) > 0) {
        return integer + "." + fractional.substring(0, truncate);
    }
    return integer;
}
exports.convertToDecimals = convertToDecimals;
/** Takes a decimal number in string and returns
* a number as a string rebased to given decimal base.
* Examples
*   convertToBase("1", 3) = "1000"
*   convertToBase("1234", 3) =   "1234000"
*   convertToBase("1.234", 3) =  "1234"
*   convertToBase("1.2345", 3) = "1234"
* convertToBase("0.12345", 3) = "123"
*/
function convertToBase(n, decimals) {
    let decimals_n = Number(decimals);
    // clear leading zeros
    let i = 0;
    for (; i < n.length && n[i] == "0"; ++i) { }
    if (i != 0)
        n = n.substring(i);
    let dotIdx = n.indexOf(".");
    if (dotIdx < 0) // no decimal part
        return n + "0".padEnd(decimals, "0");
    let integer = n.substring(0, dotIdx);
    if (decimals_n == 0)
        return integer;
    let fractional = n.substring(dotIdx + 1, dotIdx + 1 + decimals).padEnd(decimals, "0");
    if (integer.length == 0)
        return fractional;
    return integer + fractional;
}
exports.convertToBase = convertToBase;
/**
 * converts a string with and commas and decimal places into a number
 * @param {string} str
 */
function toNumber(str) {
    const result = Number(str.replace(/,/g, ""));
    if (isNaN(result))
        return 0;
    return result;
}
exports.toNumber = toNumber;
/**
 * Formats a number in NEAR to a string with commas and 5 decimal places
 * @param {number} n
 */
function toStringDecSimple(n) {
    const decimals = 5;
    const textNoDec = Math.round(n * 10 ** decimals).toString().padStart(decimals + 1, "0");
    return textNoDec.slice(0, -decimals) + "." + textNoDec.slice(-decimals);
}
exports.toStringDecSimple = toStringDecSimple;
/**
 * Formats a number in NEAR to a string with commas and 5 decimal places
 * @param {number} n
 */
function toStringDecLong(n) {
    const decimals = 8;
    const textNoDec = Math.round(n * 10 ** decimals).toString().padStart(decimals + 1, "0");
    return addCommas(textNoDec.slice(0, -decimals) + "." + textNoDec.slice(-decimals));
}
exports.toStringDecLong = toStringDecLong;
/**
 * Formats a bigint in NEAR to a string with commas and 5 decimal places
 * @param {number} n
 */
function bigintToStringDecLong(n) {
    const nString = n.toString();
    const nyton = ytonLong(nString);
    const output = toStringDecLong(nyton);
    return output;
}
exports.bigintToStringDecLong = bigintToStringDecLong;
/**
* Formats a number in NEAR to a string with commas and 5 decimal places
* @param {number} n
*/
function toStringDec(n) {
    return addCommas(toStringDecSimple(n));
}
exports.toStringDec = toStringDec;
/**
* removes extra zeroes after the decimal point
* it leaves >4,2, or none (never 3 to not confuse the international user)
* @param {number} n
*/
function removeDecZeroes(withDecPoint) {
    let decPointPos = withDecPoint.indexOf('.');
    if (decPointPos <= 0)
        return withDecPoint;
    let decimals = withDecPoint.length - decPointPos - 1;
    while (withDecPoint.endsWith("0") && decimals-- > 4)
        withDecPoint = withDecPoint.slice(0, -1);
    if (withDecPoint.endsWith("00"))
        withDecPoint = withDecPoint.slice(0, -2);
    if (withDecPoint.endsWith(".00"))
        withDecPoint = withDecPoint.slice(0, -3);
    return withDecPoint;
}
exports.removeDecZeroes = removeDecZeroes;
/**
* Formats a number in NEAR to a string with commas and 5,2, or 0 decimal places
* @param {number} n
*/
function toStringDecMin(n) {
    return addCommas(removeDecZeroes(toStringDecSimple(n)));
}
exports.toStringDecMin = toStringDecMin;
/**
 * adds commas to a string number
 * @param {string} str
 */
function addCommas(str) {
    let n = str.indexOf(".");
    if (n == -1)
        n = str.length;
    n -= 4;
    while (n >= 0) {
        str = str.slice(0, n + 1) + "," + str.slice(n + 1);
        n = n - 3;
    }
    return str;
}
exports.addCommas = addCommas;
