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
// Define paths to XML files
const PATH = {
    stylesXmlPaths: {
        values: "/vizbee_resources/android/light/styles.xml",
        valuesNight: "./vizbee_resources/android/dark/styles.xml",
    },
    colorsXmlPaths: {
        values: "./vizbee_resources/android/light/colors.xml",
        valuesNight: "./vizbee_resources/android/dark/colors.xml",
    },
};
/**
 * Creates an empty XML file at the specified path.
 * @param filePath - Path to the XML file to create.
 */
const createEmptyXml = (filePath) => {
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const builder = new xml2js_1.default.Builder();
    const emptyXml = builder.buildObject({ resources: {} });
    fs_1.default.writeFileSync(filePath, emptyXml);
};
/**
 * Merges two XML files into one, merging styles and colors.
 * @param existingFilePath - Path to the existing XML file.
 * @param newFilePath - Path to the new XML file to merge.
 */
const mergeXmlFiles = async (existingFilePath, newFilePath) => {
    if (!fs_1.default.existsSync(newFilePath)) {
        return;
    }
    if (!fs_1.default.existsSync(existingFilePath)) {
        createEmptyXml(existingFilePath);
    }
    const existingXml = fs_1.default.readFileSync(existingFilePath, "utf8");
    const newXml = fs_1.default.readFileSync(newFilePath, "utf8");
    const existingJson = await xml2js_1.default.parseStringPromise(existingXml);
    const newJson = await xml2js_1.default.parseStringPromise(newXml);
    // Ensure resources and arrays exist
    existingJson.resources = existingJson.resources || {};
    existingJson.resources.style = existingJson.resources.style || [];
    existingJson.resources.color = existingJson.resources.color || [];
    // Function to merge resources
    const mergeResources = (existing, toMerge) => {
        toMerge.forEach((item) => {
            const existingItemIndex = existing.findIndex((exItem) => JSON.stringify(exItem.$) === JSON.stringify(item.$));
            if (existingItemIndex === -1) {
                existing.push(item);
            }
        });
    };
    mergeResources(existingJson.resources.style, newJson.resources.style || []);
    mergeResources(existingJson.resources.color, newJson.resources.color || []);
    const builder = new xml2js_1.default.Builder();
    const mergedXml = builder.buildObject(existingJson);
    fs_1.default.writeFileSync(existingFilePath, mergedXml);
};
/**
 * A config plugin that copies and merges colors.xml and styles.xml files into Android project.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withCopyColorAndStyleXml = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (config) => {
            const valuesDir = path_1.default.join(config.modRequest.platformProjectRoot, "app", "src", "main", "res", "values");
            const valuesNightDir = path_1.default.join(config.modRequest.platformProjectRoot, "app", "src", "main", "res", "values-night");
            await mergeXmlFiles(path_1.default.join(valuesDir, "styles.xml"), path_1.default.join(config.modRequest.projectRoot, PATH.stylesXmlPaths.values));
            (0, helper_1.log)(`Merged styles.xml for Android project.`);
            await mergeXmlFiles(path_1.default.join(valuesNightDir, "styles.xml"), path_1.default.join(config.modRequest.projectRoot, PATH.stylesXmlPaths.valuesNight));
            (0, helper_1.log)(`Merged styles.xml for Android project (night mode).`);
            await mergeXmlFiles(path_1.default.join(valuesDir, "colors.xml"), path_1.default.join(config.modRequest.projectRoot, PATH.colorsXmlPaths.values));
            (0, helper_1.log)(`Merged colors.xml for Android project.`);
            await mergeXmlFiles(path_1.default.join(valuesNightDir, "colors.xml"), path_1.default.join(config.modRequest.projectRoot, PATH.colorsXmlPaths.valuesNight));
            (0, helper_1.log)(`Merged colors.xml for Android project (night mode).`);
            return config;
        },
    ]);
};
exports.default = withCopyColorAndStyleXml;
