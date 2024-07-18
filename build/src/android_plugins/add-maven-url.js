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
 * Reads the content of a file asynchronously.
 * @param filePath - The path to the file.
 * @returns A promise that resolves to the content of the file.
 */
async function readFileAsync(filePath) {
    return fs_1.default.promises.readFile(filePath, "utf8");
}
/**
 * Saves content to a file asynchronously.
 * @param filePath - The path to the file.
 * @param content - The content to save.
 * @returns A promise that resolves when the file has been written.
 */
async function saveFileAsync(filePath, content) {
    return fs_1.default.promises.writeFile(filePath, content, "utf8");
}
/**
 * A config plugin to add a Maven URL to the Android build.gradle file.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withAddMavenUrl = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        "android",
        async (config) => {
            const file = path_1.default.join(config.modRequest.platformProjectRoot, "build.gradle");
            const contents = await readFileAsync(file);
            const newContents = addMavenUrl(contents);
            await saveFileAsync(file, newContents);
            return config;
        },
    ]);
};
/**
 * Adds a Maven URL to the provided Gradle build script content.
 * @param src - The original Gradle build script content.
 * @returns The modified Gradle build script content.
 */
function addMavenUrl(src) {
    (0, helper_1.log)("Adding Maven URL to build.gradle");
    const allProjectsMatch = src.match(/allprojects\s*{[\s\S]*?}\s}/);
    if (allProjectsMatch) {
        const allProjectsContent = allProjectsMatch[0];
        const repositoriesMatch = allProjectsContent.match(/repositories\s*{([\s\S]*?)}\s}/);
        if (repositoriesMatch) {
            const repositoriesContent = repositoriesMatch[0]; // Extracting the content inside repositories
            const updatedRepositoriesContent = repositoriesContent.replace("{", `{\n    maven { url 'https://repo.claspws.tv/artifactory/libs' }\n`);
            const updatedAllProjectsContent = allProjectsContent.replace(/repositories\s*{([\s\S]*?)}\s}/, updatedRepositoriesContent);
            return src.replace(/allprojects\s*{([\s\S]*?)}\s}/, updatedAllProjectsContent);
        }
        else {
            // If repositories block doesn't exist, add it with Maven URL
            return src.replace(/allprojects\s*{([\s\S]*?)}/, `allprojects {\n    repositories {\n        maven { url 'https://repo.claspws.tv/artifactory/libs' }\n    }\n}`);
        }
    }
    else {
        // If allprojects block doesn't exist, add it with repositories and Maven URL
        return `${src}\nallprojects {\n    repositories {\n        maven { url 'https://repo.claspws.tv/artifactory/libs' }\n    }\n}`;
    }
}
/**
 * Main export function to apply the plugin.
 * @param config - The Expo config object.
 * @returns The modified config object with the added plugin.
 */
const withCustomPlugin = (config) => (0, config_plugins_1.withPlugins)(config, [withAddMavenUrl]);
exports.default = withCustomPlugin;
