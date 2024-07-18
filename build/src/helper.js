"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
// Wrapper function for console.log
function log(...args) {
    const isProduction = process.env.NODE_ENV === "production";
    if (!isProduction) {
        console.log(...args);
    }
}
exports.log = log;
