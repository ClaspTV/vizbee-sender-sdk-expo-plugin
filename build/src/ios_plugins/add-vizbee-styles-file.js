"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helper_1 = require("../helper");
const { getAppDelegateFilePath } = config_plugins_1.IOSConfig.Paths;
/**
 * Retrieves the main group for a specific target in an Xcode project.
 * @param project - The Xcode project instance.
 * @param targetName - The name of the target.
 * @returns The main group object if found; otherwise, null.
 */
function getMainGroupForTarget(project, targetName) {
    if (targetName) {
        const mainGroup = project.pbxGroupByName(targetName);
        return mainGroup;
    }
    return null;
}
/**
 * A config plugin that adds VizbeeStyles.swift file to an Xcode project.
 * @param config - The Expo config object.
 * @param props - Additional properties.
 * @returns The modified config object.
 */
const withAddVizbeeStylesFile = (config, props) => {
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        const { target = config.modRequest.projectName } = props || {};
        const swiftFilePath = `${config.modRequest.projectRoot}/vizbee_resources/ios/VizbeeStyles.swift`;
        (0, helper_1.log)(`Adding VizbeeStyles.swift file to Xcode project`);
        // Check if the file exists
        try {
            await fs_1.default.promises.access(swiftFilePath, fs_1.default.constants.R_OK);
        }
        catch (error) {
            throw new Error(`Cannot find ${swiftFilePath}. Please ensure it exists.`);
        }
        // Read the Swift file content
        const swiftFileContent = fs_1.default.readFileSync(swiftFilePath, "utf-8");
        // Add or modify the Xcode project
        if (!config.modResults) {
            throw new Error(`Failed to modify Xcode project.`);
        }
        // Get the Xcode project "key" that the new file entries will be added to
        const xcodeProject = config.modResults;
        const { projectRoot } = config.modRequest;
        // Resolve the target
        const nativeTargets = xcodeProject.pbxNativeTargetSection();
        const targetEntry = Object.entries(nativeTargets).find(([, value]) => value.name === target);
        if (!targetEntry) {
            throw new Error(`Cannot find target named ${target}`);
        }
        const [targetId] = targetEntry;
        // The directory where new source files should be copied to
        const sourceDir = path_1.default.dirname(getAppDelegateFilePath(projectRoot));
        const destinationDir = path_1.default.join(sourceDir, "Vizbee");
        if (!fs_1.default.existsSync(destinationDir)) {
            fs_1.default.mkdirSync(destinationDir, { recursive: true });
        }
        const fileName = `VizbeeStyles.swift`;
        fs_1.default.writeFileSync(path_1.default.join(destinationDir, fileName), swiftFileContent);
        const group = xcodeProject.pbxCreateGroup("Vizbee", `${target}/Vizbee`);
        const mainGroup = getMainGroupForTarget(xcodeProject, target);
        mainGroup.children.push({
            value: group,
            comment: "Vizbee",
        });
        xcodeProject.addSourceFile(fileName, { target: targetId }, group);
        return config;
    });
};
exports.default = withAddVizbeeStylesFile;
