"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
/**
 * Adds Vizbee initialization line to MainApplication's onCreate method.
 * @param config - Expo config object.
 * @param options - Options object containing parameters like vizbeeAppId and layoutConfigFilePath.
 * @returns The modified config object.
 */
const withVizbeeInitialization = (config, { vizbeeAppId, layoutConfigFilePath }) => {
    if (!vizbeeAppId) {
        throw new Error(`Cannot find vizbeeAppId in params it is mandatory`);
    }
    config = (0, config_plugins_1.withMainApplication)(config, (config) => {
        let layoutConfig = null;
        if (layoutConfigFilePath) {
            if (fs_1.default.existsSync(layoutConfigFilePath)) {
                const fileContents = fs_1.default.readFileSync(layoutConfigFilePath, "utf8");
                layoutConfig = JSON.parse(fileContents);
            }
            else {
                throw new Error(`Could not find layout config file at path: ${layoutConfigFilePath}`);
            }
        }
        config.modResults.contents = addVizbeeInitialization(config.modResults.contents, vizbeeAppId, layoutConfig);
        return config;
    });
    return config;
};
/**
 * Adds the Vizbee initialization line to MainApplication.java or MainApplication.kt.
 * @param mainApplicationContents - Contents of MainApplication file as string.
 * @param vizbeeAppId - Vizbee application ID.
 * @param layoutConfig - Layout configuration object.
 * @returns Updated contents of MainApplication file.
 */
function addVizbeeInitialization(mainApplicationContents, vizbeeAppId, layoutConfig) {
    var _a, _b, _c, _d, _e, _f, _g;
    const VIZBEE_INITIALIZATION_LINE = layoutConfig
        ? `VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}",
    new org.json.JSONObject(${JSON.stringify(layoutConfig)})
);`
        : `VizbeeBootstrap.getInstance().initialize(
    this,
    "${vizbeeAppId}"
);`;
    // For Java and Kotlin, look for super.onCreate() and insert the initialization line after it
    const javaSuperOnCreateMatch = mainApplicationContents.match(/super\.onCreate\(.*\);\n/);
    const kotlinSuperOnCreateMatch = mainApplicationContents.match(/super\.onCreate\(.*\)\n/);
    const importLine = "import tv.vizbee.rnsender.VizbeeBootstrap;";
    if ((javaSuperOnCreateMatch === null || javaSuperOnCreateMatch === void 0 ? void 0 : javaSuperOnCreateMatch.index) || (kotlinSuperOnCreateMatch === null || kotlinSuperOnCreateMatch === void 0 ? void 0 : kotlinSuperOnCreateMatch.index)) {
        const superOnCreateIndex = ((_b = (_a = javaSuperOnCreateMatch === null || javaSuperOnCreateMatch === void 0 ? void 0 : javaSuperOnCreateMatch.index) !== null && _a !== void 0 ? _a : kotlinSuperOnCreateMatch === null || kotlinSuperOnCreateMatch === void 0 ? void 0 : kotlinSuperOnCreateMatch.index) !== null && _b !== void 0 ? _b : 0) +
            ((_f = (_d = (_c = javaSuperOnCreateMatch === null || javaSuperOnCreateMatch === void 0 ? void 0 : javaSuperOnCreateMatch[0]) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : (_e = kotlinSuperOnCreateMatch === null || kotlinSuperOnCreateMatch === void 0 ? void 0 : kotlinSuperOnCreateMatch[0]) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0);
        mainApplicationContents =
            mainApplicationContents.slice(0, superOnCreateIndex) +
                VIZBEE_INITIALIZATION_LINE +
                "\n" +
                mainApplicationContents.slice(superOnCreateIndex);
    }
    else {
        throw new Error(`Could not find super.onCreate() method call in MainApplication contents.`);
    }
    // Add import statement if not already present
    if (!mainApplicationContents.includes(importLine)) {
        const packageDeclarationMatch = mainApplicationContents.match(/package\s+[\w.]+;?/);
        if (packageDeclarationMatch) {
            const packageDeclarationIndex = ((_g = packageDeclarationMatch.index) !== null && _g !== void 0 ? _g : 0) +
                packageDeclarationMatch[0].length;
            mainApplicationContents =
                mainApplicationContents.slice(0, packageDeclarationIndex) +
                    "\n\n" +
                    importLine +
                    "\n" +
                    mainApplicationContents.slice(packageDeclarationIndex);
        }
    }
    return mainApplicationContents;
}
exports.default = withVizbeeInitialization;
