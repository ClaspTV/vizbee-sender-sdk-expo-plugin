"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helper_1 = require("../helper");
const { getAppDelegateFilePath, getSourceRoot } = config_plugins_1.IOSConfig.Paths;
/**
 * Retrieves all font files (ttf, otf) from a specified folder path.
 * @param folderPath - The path to the folder containing font files.
 * @returns An array of font file names.
 */
function getFontFiles(folderPath) {
    return fs_1.default.readdirSync(folderPath).filter((file) => {
        return (fs_1.default.statSync(path_1.default.join(folderPath, file)).isFile() &&
            /\.(ttf|otf)$/i.test(file));
    });
}
/**
 * A config plugin that adds custom fonts to an Expo project for both iOS and Android.
 * @param config - The Expo config object.
 * @param options - Font configuration options.
 * @returns The modified config object.
 */
const withFonts = (config, { fontFolder, target = null }) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const { projectRoot } = config.modRequest;
        fontFolder = fontFolder || `${projectRoot}/assets/fonts`;
        // Get all font files from the specified folder
        const fonts = getFontFiles(fontFolder);
        const existingFonts = config.modResults.UIAppFonts || [];
        config.modResults.UIAppFonts = [
            ...existingFonts,
            ...fonts.map((fontFile) => fontFile.toLowerCase()), // Relative path to font files
        ];
        return config;
    });
    config = (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        const xcodeProject = config.modResults;
        const { projectRoot, projectName = path_1.default.basename(getSourceRoot(projectRoot)), } = config.modRequest;
        fontFolder = fontFolder || `${projectRoot}/assets/fonts`;
        // Get all font files from the specified folder
        const fonts = getFontFiles(fontFolder);
        const targetName = target || projectName;
        // Resolve the target
        const nativeTargets = xcodeProject.pbxNativeTargetSection();
        const targetEntry = Object.entries(nativeTargets).find(([, value]) => value.name === targetName);
        if (!targetEntry) {
            throw new Error(`Cannot find target named ${targetName}`);
        }
        const [targetId] = targetEntry;
        // The directory where new source files should be copied to
        const sourceDir = path_1.default.dirname(getAppDelegateFilePath(projectRoot));
        // Copy font files to the destination directory
        for (const fontFile of fonts) {
            const sourceFile = path_1.default.join(fontFolder, fontFile);
            const destinationFile = path_1.default.join(sourceDir, fontFile.toLowerCase());
            try {
                await fs_1.default.promises.copyFile(sourceFile, destinationFile);
                (0, helper_1.log)(`Adding resource file ${fontFile} to iOS`);
                config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                    filepath: destinationFile,
                    groupName: targetName,
                    project: xcodeProject,
                    isBuildFile: true,
                    verbose: true,
                    targetUuid: targetId,
                });
            }
            catch (error) {
                console.error(`Failed to copy font file ${fontFile}:`, error);
            }
        }
        (0, helper_1.log)("Resource files copied successfully.");
        return config;
    });
    return config;
};
exports.default = withFonts;
