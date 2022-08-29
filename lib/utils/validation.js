"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesAtleastOneObjectContainsKeyValue = exports.doesOnjectContainsKey = exports.isValidArray = void 0;
const getType = (val) => {
    const type = Object.prototype.toString.call(val);
    return type.slice(8, type.length - 1);
};
const isValidArray = (val) => {
    return Array.isArray(val) && !!val.length;
};
exports.isValidArray = isValidArray;
const doesOnjectContainsKey = (obj, key) => {
    if (!obj) {
        return false;
    }
    const type = getType(obj);
    if (type !== "Object") {
        return false;
    }
    return Object.keys(obj).includes(key);
};
exports.doesOnjectContainsKey = doesOnjectContainsKey;
const doesAtleastOneObjectContainsKeyValue = (arr = [], key, value) => {
    let returnStatus = false;
    for (const objArray of arr) {
        for (const obj of objArray) {
            if (doesOnjectContainsKey(obj, key)) {
                if (obj[key] === value) {
                    returnStatus = true;
                    break;
                }
            }
        }
    }
    return returnStatus;
};
exports.doesAtleastOneObjectContainsKeyValue = doesAtleastOneObjectContainsKeyValue;
