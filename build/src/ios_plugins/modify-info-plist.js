"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const helper_1 = require("../helper");
/**
 * A config plugin that modifies the Info.plist to add Bonjour services and a local network usage description.
 * @param config - The Expo config object.
 * @param props - The properties to customize the modification.
 * @param props.description - The description for local network usage.
 * @param props.receiverAppId - The optional receiver app ID for custom Bonjour service.
 * @returns The modified config object.
 */
const withModifyInfoPlist = (config, { description = "${PRODUCT_NAME} uses the local network to discover Cast-enabled devices on your WiFi network.", receiverAppId = null, }) => {
    // iOS: Modify Info.plist to add Bonjour services and local network usage description
    (0, helper_1.log)("Starting withModifyInfoPlist with description:", description);
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        (0, helper_1.log)("Modifying Info.plist");
        const bonjourServices = [
            "_googlecast._tcp",
            "_amzn-wplay._tcp",
            "_viziocast._tcp",
        ];
        if (receiverAppId) {
            (0, helper_1.log)("Adding custom Bonjour service for receiverAppId:", receiverAppId);
            bonjourServices.push(`_${receiverAppId}._googlecast._tcp`);
        }
        config.modResults["Bonjour services"] = bonjourServices;
        (0, helper_1.log)("Bonjour services set to:", bonjourServices);
        config.modResults.NSLocalNetworkUsageDescription = description;
        (0, helper_1.log)("NSLocalNetworkUsageDescription set to:", description);
        return config;
    });
    return config;
};
exports.default = withModifyInfoPlist;
