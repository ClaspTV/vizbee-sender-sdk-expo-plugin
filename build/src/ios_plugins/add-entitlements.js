"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const helper_1 = require("../helper");
/**
 * A config plugin that modifies the entitlements plist to enable specific capabilities.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withCustomEntitlements = (config) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, async (config) => {
        (0, helper_1.log)("Modifying entitlements plist");
        // Modify entitlements as needed
        config.modResults["com.apple.developer.networking.multicast"] = true;
        config.modResults["com.apple.developer.networking.wifi-info"] = true;
        return config;
    });
};
exports.default = withCustomEntitlements;
