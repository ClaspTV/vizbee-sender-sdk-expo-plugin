"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xml2js_1 = __importDefault(require("xml2js"));
const helper_1 = require("../helper");
/**
 * Ensures that the network security config is defined in the Android manifest.
 * @param androidManifest - The Android manifest object.
 * @returns The modified Android manifest object.
 * @throws Will throw an error if the application array or MainApplication is not found in the manifest.
 */
function ensureNetworkSecurityConfig(androidManifest) {
    const { manifest } = androidManifest;
    if (!Array.isArray(manifest.application)) {
        throw new Error("configureAndroidManifest: No application array in manifest?");
    }
    const application = manifest.application.find((item) => item.$ && item.$["android:name"] === ".MainApplication");
    if (!application) {
        throw new Error("configureAndroidManifest: No .MainApplication?");
    }
    const networkSecurityConfigAttribute = "android:networkSecurityConfig";
    const networkSecurityConfigPath = "@xml/network_security_config";
    // Check if network security config is already defined
    if (!Object.prototype.hasOwnProperty.call(application.$, networkSecurityConfigAttribute)) {
        application.$[networkSecurityConfigAttribute] = networkSecurityConfigPath;
        (0, helper_1.log)("Added networkSecurityConfig attribute to MainApplication.");
    }
    else {
        (0, helper_1.log)("networkSecurityConfig attribute already exists in MainApplication.");
    }
    return androidManifest;
}
/**
 * Ensures that the network_security_config.xml file exists and is properly configured.
 * @param projectRoot - The root directory of the project.
 */
async function ensureNetworkSecurityConfigXML(projectRoot) {
    const networkSecurityConfigPath = path_1.default.join(projectRoot, "android", "app", "src", "main", "res", "xml", "network_security_config.xml");
    const configXML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true"/>
</network-security-config>`;
    if (fs_1.default.existsSync(networkSecurityConfigPath)) {
        // Read existing XML content
        const content = fs_1.default.readFileSync(networkSecurityConfigPath, "utf8");
        const parser = new xml2js_1.default.Parser();
        const builder = new xml2js_1.default.Builder();
        const xml = await parser.parseStringPromise(content);
        if (!xml["network-security-config"]["base-config"][0]["$"]
            .cleartextTrafficPermitted ||
            xml["network-security-config"]["base-config"][0]["$"]
                .cleartextTrafficPermitted !== "true") {
            xml["network-security-config"]["base-config"][0]["$"].cleartextTrafficPermitted = "true";
            const updatedContent = builder.buildObject(xml);
            fs_1.default.writeFileSync(networkSecurityConfigPath, updatedContent);
            (0, helper_1.log)("Updated network_security_config.xml to permit cleartext traffic.");
        }
        else {
            (0, helper_1.log)("network_security_config.xml already permits cleartext traffic.");
        }
    }
    else {
        // Create new network_security_config.xml with the desired content
        fs_1.default.mkdirSync(path_1.default.dirname(networkSecurityConfigPath), { recursive: true });
        fs_1.default.writeFileSync(networkSecurityConfigPath, configXML);
        (0, helper_1.log)("Created new network_security_config.xml to permit cleartext traffic.");
    }
}
/**
 * Comments out the cleartext traffic setting in the debug Android manifest.
 * @param projectRoot - The root directory of the project.
 */
async function commentOutCleartextTrafficInDebugManifest(projectRoot) {
    const debugManifestPath = path_1.default.join(projectRoot, "android", "app", "src", "debug", "AndroidManifest.xml");
    if (fs_1.default.existsSync(debugManifestPath)) {
        let content = fs_1.default.readFileSync(debugManifestPath, "utf8");
        const lineToComment = '<application android:usesCleartextTraffic="true" tools:targetApi="28" tools:ignore="GoogleAppIndexingWarning" tools:replace="android:usesCleartextTraffic" />';
        if (content.includes(lineToComment)) {
            content = content.replace(lineToComment, `<!-- ${lineToComment} -->`);
            fs_1.default.writeFileSync(debugManifestPath, content, "utf8");
        }
        else {
            (0, helper_1.log)("Cleartext traffic setting already commented out in debug AndroidManifest.xml.");
        }
    }
    else {
        (0, helper_1.log)("Debug AndroidManifest.xml does not exist.");
    }
}
/**
 * A config plugin to ensure the network security config is properly set up for an Android project.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withNetworkSecurityConfig = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, async (config) => {
        config.modResults = ensureNetworkSecurityConfig(config.modResults);
        await ensureNetworkSecurityConfigXML(config.modRequest.projectRoot);
        await commentOutCleartextTrafficInDebugManifest(config.modRequest.projectRoot);
        return config;
    });
};
exports.default = withNetworkSecurityConfig;
