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
 * A config plugin to copy custom font files to the Android project.
 * @param config - The Expo config object.
 * @param options - Options for the plugin.
 * @param options.fontFolder - The folder containing the font files. Defaults to `assets/fonts` in the project root.
 * @param options.target - The target location for the font files. Currently not used.
 * @returns The modified config object.
 */
const withFonts = (config, _a) => {
    var _b;
    var { fontFolder = `${(_b = config._internal) === null || _b === void 0 ? void 0 : _b.projectRoot}/assets/fonts` } = _a;
    /**
     * Reads all font files from the specified folder.
     * @param folderPath - The path to the folder containing the font files.
     * @returns An array of font file names.
     */
    function getFontFiles(folderPath) {
        const files = fs_1.default.readdirSync(folderPath);
        return files.filter((file) => {
            return (fs_1.default.statSync(path_1.default.join(folderPath, file)).isFile() &&
                /\.(ttf|otf)$/.test(file)); // Filter only font files
        });
    }
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (config) => {
            const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, "app", "src", "main", "res", "font");
            // Ensure the font directory exists
            if (!fs_1.default.existsSync(fontsDir)) {
                fs_1.default.mkdirSync(fontsDir, { recursive: true });
            }
            const fonts = getFontFiles(fontFolder);
            // Copy font files to the destination directory
            for (const fontFile of fonts) {
                const sourceFile = path_1.default.join(fontFolder, fontFile);
                const destinationFile = path_1.default.join(fontsDir, fontFile.toLowerCase());
                (0, helper_1.log)(`Adding resource file ${fontFile} to android`);
                await fs_1.default.promises.copyFile(sourceFile, destinationFile);
            }
            (0, helper_1.log)("Resource files copied successfully.");
            return config;
        },
    ]);
};
exports.default = withFonts;
