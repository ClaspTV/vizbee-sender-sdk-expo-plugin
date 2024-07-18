"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helper_1 = require("../helper");
/**
 * Asynchronously reads the content of a file.
 * @param filePath - The path to the file.
 * @returns A promise that resolves to the file content as a string.
 */
async function readFileAsync(filePath) {
    return fs_1.default.promises.readFile(filePath, "utf8");
}
/**
 * Asynchronously writes content to a file.
 * @param filePath - The path to the file.
 * @param content - The content to write.
 * @returns A promise that resolves when the file is written.
 */
async function saveFileAsync(filePath, content) {
    return fs_1.default.promises.writeFile(filePath, content, "utf8");
}
/**
 * A config plugin that adds custom pod sources to the Podfile.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withAddPodSource = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (config) => {
            const file = path_1.default.join(config.modRequest.platformProjectRoot, "Podfile");
            const contents = await readFileAsync(file);
            await saveFileAsync(file, addPodSource(contents));
            return config;
        },
    ]);
};
/**
 * Adds custom pod sources to the Podfile content.
 * @param src - The original Podfile content.
 * @returns The modified Podfile content.
 */
function addPodSource(src) {
    (0, helper_1.log)(`Adding custom pod sources to Podfile`);
    return (0, generateCode_1.mergeContents)({
        tag: `rn-add-pod-source`,
        src,
        newSrc: `source "https://git.vizbee.tv/Vizbee/Specs.git"\nsource "https://github.com/CocoaPods/Specs.git"`,
        anchor: /^/,
        offset: 0,
        comment: "#",
    }).contents;
}
/**
 * A config plugin that applies multiple plugins including withAddPodSource.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withCustomPlugins = (config) => (0, config_plugins_1.withPlugins)(config, [withAddPodSource]);
exports.default = withCustomPlugins;
