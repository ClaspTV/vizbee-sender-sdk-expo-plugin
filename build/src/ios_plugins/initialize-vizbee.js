"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helper_1 = require("../helper");
const { getSourceRoot } = config_plugins_1.IOSConfig.Paths;
/**
 * Appends an import statement to the contents if it's not already present.
 * @param contents - The contents of the file.
 * @param importStatement - The import statement to append.
 * @returns The modified contents.
 */
function appendImportIfNeeded(contents, importStatement) {
    if (!contents.includes(importStatement)) {
        const match = contents.match(/#import "AppDelegate.h"/);
        if (match && match.index !== undefined) {
            const insertPosition = match.index + match[0].length;
            contents =
                contents.slice(0, insertPosition) +
                    `\n${importStatement}` +
                    contents.slice(insertPosition);
        }
        else {
            console.warn('Could not find "#import "AppDelegate.h"" to insert the import statement.');
        }
    }
    return contents;
}
/**
 * Appends a Swift import statement to the contents if it's not already present.
 * @param contents - The contents of the file.
 * @param importStatement - The import statement to append.
 * @returns The modified contents.
 */
function appendSwiftImportIfNeeded(contents, importStatement) {
    if (!contents.includes(importStatement)) {
        const match = contents.match(/import UIKit/);
        if (match && match.index !== undefined) {
            const insertPosition = match.index + match[0].length;
            contents =
                contents.slice(0, insertPosition) +
                    `\n${importStatement}` +
                    contents.slice(insertPosition);
        }
        else {
            console.warn('Could not find "import UIKit" to insert the import statement.');
        }
    }
    return contents;
}
/**
 * Modifies the AppDelegate file to include Vizbee initialization code.
 * @param theme - The theme to apply.
 * @param appDelegate - The AppDelegate contents.
 * @param projectName - The project name.
 * @param vizbeeAppId - The Vizbee App ID.
 * @param layoutConfig - The layout configuration.
 * @param language - The language of the AppDelegate file (objcpp or swift).
 * @returns The modified AppDelegate contents.
 */
function modifyAppDelegate(theme, appDelegate, projectName, vizbeeAppId, layoutConfig, language) {
    if (!vizbeeAppId) {
        throw new Error("Cannot find vizbeeAppId in params it is mandatory");
    }
    (0, helper_1.log)(`Modifying AppDelegate`);
    let themeConfig = "";
    if (language === "objcpp") {
        themeConfig =
            theme === "dark"
                ? "[VizbeeStyles darkTheme]"
                : "[VizbeeStyles lightTheme]";
        appDelegate.contents = appendImportIfNeeded(appDelegate.contents, `#import "${projectName}-Swift.h"`);
        appDelegate.contents = appendImportIfNeeded(appDelegate.contents, `#import <RNVizbeeSenderSdk/VizbeeBootstrap.h>`);
        appDelegate.contents = appendImportIfNeeded(appDelegate.contents, `#import "ExpoModulesCore-Swift.h"`);
        let layoutConfigLine = "";
        let getLayoutsConfigMethod = "";
        if (layoutConfig) {
            const nsDictionaryLayoutConfig = JSON.stringify(layoutConfig)
                .replace(/"/g, '@"')
                .replace(/:/g, '":')
                .replace(/,/g, '",');
            layoutConfigLine = `
  options.layoutsConfig = [self getLayoutsConfig];`;
            getLayoutsConfigMethod = `
- (VZBLayoutsConfig *)getLayoutsConfig {
  NSDictionary *layoutConfigDict = ${nsDictionaryLayoutConfig};
  VZBLayoutsConfig *layoutConfig = [[VZBLayoutsConfig alloc] initFromDictionary:layoutConfigDict];
  return layoutConfig;
}`;
        }
        const codeToAdd = `
  VZBOptions* options = [VZBOptions new];
  options.useVizbeeUIWindowAtLevel = UIWindowLevelNormal + 3;
  options.uiConfig = ${themeConfig};${layoutConfigLine}
  [[VizbeeBootstrap getInstance] initialize:@"${vizbeeAppId}" withOptions:options];`;
        // Find the didFinishLaunchingWithOptions method and insert code there
        const didFinishLaunchingRegex = /(didFinishLaunchingWithOptions[\s\S]*?{[\s\S]*?)(\s*return\s)/;
        if (didFinishLaunchingRegex.test(appDelegate.contents)) {
            appDelegate.contents = appDelegate.contents.replace(didFinishLaunchingRegex, (match, methodStart, returnStatement) => {
                (0, helper_1.log)("Inserting Vizbee initialization code into didFinishLaunchingWithOptions");
                return `${methodStart}\n${codeToAdd}${returnStatement}`;
            });
        }
        // Add the getLayoutsConfig method if not already present
        if (layoutConfig && !appDelegate.contents.includes("getLayoutsConfig")) {
            const endIndex = appDelegate.contents.lastIndexOf("@end");
            if (endIndex !== -1) {
                appDelegate.contents =
                    appDelegate.contents.slice(0, endIndex) +
                        getLayoutsConfigMethod +
                        "\n\n@end";
                (0, helper_1.log)("Added getLayoutsConfig method to AppDelegate");
            }
        }
    }
    else if (language === "swift") {
        themeConfig =
            theme === "dark" ? "VizbeeStyles.darkTheme" : "VizbeeStyles.lightTheme";
        appDelegate.contents = appendSwiftImportIfNeeded(appDelegate.contents, `@import RNVizbeeSenderSdk;`);
        let layoutConfigLine = "";
        let getLayoutsConfigMethod = "";
        if (layoutConfig) {
            const swiftDictLayoutConfig = JSON.stringify(layoutConfig)
                .replace(/"/g, "")
                .replace(/:/g, ": ")
                .replace(/,/g, ", ");
            layoutConfigLine = `
  options.layoutsConfig = getLayoutsConfig()`;
            getLayoutsConfigMethod = `
func getLayoutsConfig() -> VZBLayoutsConfig {
  let layoutConfigDict: [String: Any] = ${swiftDictLayoutConfig}
  return VZBLayoutsConfig(fromDictionary: layoutConfigDict)
}`;
        }
        const codeToAdd = `
  let options = VZBOptions()
  options.useVizbeeUIWindowAtLevel = UIWindow.Level.normal.rawValue + 3
  options.uiConfig = ${themeConfig}${layoutConfigLine}
  VizbeeBootstrap.getInstance().initialize("${vizbeeAppId}", withOptions: options)`;
        // Find the application(_:didFinishLaunchingWithOptions:) method and insert code there
        const didFinishLaunchingRegex = /(func application[\s\S]*?didFinishLaunchingWithOptions[\s\S]*?{[\s\S]*?)(\s*return\s)/;
        if (didFinishLaunchingRegex.test(appDelegate.contents)) {
            appDelegate.contents = appDelegate.contents.replace(didFinishLaunchingRegex, (match, methodStart, returnStatement) => {
                (0, helper_1.log)("Inserting Vizbee initialization code into didFinishLaunchingWithOptions");
                return `${methodStart}\n${codeToAdd}${returnStatement}`;
            });
        }
        // Add the getLayoutsConfig method if not already present
        if (layoutConfig && !appDelegate.contents.includes("getLayoutsConfig")) {
            const classEndIndex = appDelegate.contents.lastIndexOf("}");
            if (classEndIndex !== -1) {
                appDelegate.contents =
                    appDelegate.contents.slice(0, classEndIndex) +
                        getLayoutsConfigMethod +
                        "\n}";
                (0, helper_1.log)("Added getLayoutsConfig method to AppDelegate");
            }
        }
    }
    return appDelegate;
}
/**
 * Config plugin to initialize Vizbee in the AppDelegate.
 * @param config - The Expo config object.
 * @param options - Configuration options.
 * @returns The modified config object.
 */
const withVizbeeInitialization = (config, { vizbeeAppId, layoutConfigFilePath = null, language = "objcpp" }) => {
    return (0, config_plugins_1.withAppDelegate)(config, (config) => {
        const { projectRoot, projectName = path_1.default.basename(getSourceRoot(projectRoot)), } = config.modRequest;
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
        config.modResults = modifyAppDelegate(config.userInterfaceStyle || "light", config.modResults, projectName, vizbeeAppId, layoutConfig, language);
        (0, helper_1.log)("Modified AppDelegate with Vizbee initialization");
        return config;
    });
};
exports.default = withVizbeeInitialization;
