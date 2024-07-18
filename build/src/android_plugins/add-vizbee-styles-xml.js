"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helper_1 = require("../helper");
/**
 * Copies theme files to the Android project's 'values' and 'values-night' folders.
 * @param projectRoot - Root path of the Android project.
 * @param lightThemeFilePath - Path to the light theme file (vizbee.xml).
 * @param darkThemeFilePath - Path to the dark theme file (vizbee.xml).
 * @throws Error if the lightThemeFilePath or darkThemeFilePath is not found.
 */
function addThemeFiles(projectRoot, lightThemeFilePath, darkThemeFilePath) {
    const androidResPath = path_1.default.join(projectRoot, "app", "src", "main", "res");
    const valuesPath = path_1.default.join(androidResPath, "values");
    const valuesNightPath = path_1.default.join(androidResPath, "values-night");
    // Check conditions and throw errors as needed
    if (!fs_1.default.existsSync(lightThemeFilePath)) {
        throw new Error(`Unable to find vizbee.xml inside Project Root folder: ${lightThemeFilePath}`);
    }
    // Ensure 'values' folder exists
    if (!fs_1.default.existsSync(valuesPath)) {
        fs_1.default.mkdirSync(valuesPath, { recursive: true });
    }
    // Copy lightThemeFilePath to 'values' folder
    const lightThemeFileName = path_1.default.basename(lightThemeFilePath);
    const targetLightThemePath = path_1.default.join(valuesPath, lightThemeFileName);
    fs_1.default.copyFileSync(lightThemeFilePath, targetLightThemePath);
    (0, helper_1.log)(`Copied ${lightThemeFileName} to ${valuesPath}`);
    // Ensure 'values-night' folder exists if darkThemeFilePath is provided
    if (darkThemeFilePath && !fs_1.default.existsSync(valuesNightPath)) {
        fs_1.default.mkdirSync(valuesNightPath, { recursive: true });
    }
    if (darkThemeFilePath && fs_1.default.existsSync(darkThemeFilePath)) {
        // Copy darkThemeFilePath to 'values-night' folder
        const darkThemeFileName = path_1.default.basename(darkThemeFilePath);
        const targetDarkThemePath = path_1.default.join(valuesNightPath, darkThemeFileName);
        fs_1.default.copyFileSync(darkThemeFilePath, targetDarkThemePath);
        (0, helper_1.log)(`Copied ${darkThemeFileName} to ${valuesNightPath}`);
    }
}
/**
 * A config plugin that adds theme files to the Android project.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withThemeFiles = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (config) => {
            const projectRoot = config.modRequest.platformProjectRoot;
            try {
                addThemeFiles(projectRoot, `${config.modRequest.projectRoot}/vizbee_resources/android/light/vizbee.xml`, `${config.modRequest.projectRoot}/vizbee_resources/android/dark/vizbee.xml`);
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error(`Failed to add theme files: ${error.message}`);
                }
                else {
                    throw new Error(`Failed to add theme files: ${String(error)}`);
                }
            }
            return config;
        },
    ]);
};
exports.default = withThemeFiles;
