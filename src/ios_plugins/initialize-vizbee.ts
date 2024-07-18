import { ConfigPlugin, withAppDelegate, IOSConfig } from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import { log } from "../helper";

const { getSourceRoot } = IOSConfig.Paths;

/**
 * Appends an import statement to the contents if it's not already present.
 * @param contents - The contents of the file.
 * @param importStatement - The import statement to append.
 * @returns The modified contents.
 */
function appendImportIfNeeded(
  contents: string,
  importStatement: string
): string {
  if (!contents.includes(importStatement)) {
    const match = contents.match(/#import "AppDelegate.h"/);
    if (match && match.index !== undefined) {
      const insertPosition = match.index + match[0].length;
      contents =
        contents.slice(0, insertPosition) +
        `\n${importStatement}` +
        contents.slice(insertPosition);
    } else {
      console.warn(
        'Could not find "#import "AppDelegate.h"" to insert the import statement.'
      );
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
function appendSwiftImportIfNeeded(
  contents: string,
  importStatement: string
): string {
  if (!contents.includes(importStatement)) {
    const match = contents.match(/import UIKit/);
    if (match && match.index !== undefined) {
      const insertPosition = match.index + match[0].length;
      contents =
        contents.slice(0, insertPosition) +
        `\n${importStatement}` +
        contents.slice(insertPosition);
    } else {
      console.warn(
        'Could not find "import UIKit" to insert the import statement.'
      );
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
function modifyAppDelegate(
  theme: "light" | "dark" | "automatic",
  appDelegate: { contents: string },
  projectName: string,
  vizbeeAppId: string,
  layoutConfig: Record<string, any> | null,
  language: "objcpp" | "swift"
): any {
  if (!vizbeeAppId) {
    throw new Error("Cannot find vizbeeAppId in params it is mandatory");
  }

  log(`Modifying AppDelegate`);

  let themeConfig = "";
  if (language === "objcpp") {
    themeConfig =
      theme === "dark"
        ? "[VizbeeStyles darkTheme]"
        : "[VizbeeStyles lightTheme]";

    appDelegate.contents = appendImportIfNeeded(
      appDelegate.contents,
      `#import "${projectName}-Swift.h"`
    );
    appDelegate.contents = appendImportIfNeeded(
      appDelegate.contents,
      `#import <RNVizbeeSenderSdk/VizbeeBootstrap.h>`
    );
    appDelegate.contents = appendImportIfNeeded(
      appDelegate.contents,
      `#import "ExpoModulesCore-Swift.h"`
    );

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
    const didFinishLaunchingRegex =
      /(didFinishLaunchingWithOptions[\s\S]*?{[\s\S]*?)(\s*return\s)/;
    if (didFinishLaunchingRegex.test(appDelegate.contents)) {
      appDelegate.contents = appDelegate.contents.replace(
        didFinishLaunchingRegex,
        (match, methodStart, returnStatement) => {
          log(
            "Inserting Vizbee initialization code into didFinishLaunchingWithOptions"
          );
          return `${methodStart}\n${codeToAdd}${returnStatement}`;
        }
      );
    }

    // Add the getLayoutsConfig method if not already present
    if (layoutConfig && !appDelegate.contents.includes("getLayoutsConfig")) {
      const endIndex = appDelegate.contents.lastIndexOf("@end");
      if (endIndex !== -1) {
        appDelegate.contents =
          appDelegate.contents.slice(0, endIndex) +
          getLayoutsConfigMethod +
          "\n\n@end";
        log("Added getLayoutsConfig method to AppDelegate");
      }
    }
  } else if (language === "swift") {
    themeConfig =
      theme === "dark" ? "VizbeeStyles.darkTheme" : "VizbeeStyles.lightTheme";

    appDelegate.contents = appendSwiftImportIfNeeded(
      appDelegate.contents,
      `@import RNVizbeeSenderSdk;`
    );

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
    const didFinishLaunchingRegex =
      /(func application[\s\S]*?didFinishLaunchingWithOptions[\s\S]*?{[\s\S]*?)(\s*return\s)/;
    if (didFinishLaunchingRegex.test(appDelegate.contents)) {
      appDelegate.contents = appDelegate.contents.replace(
        didFinishLaunchingRegex,
        (match, methodStart, returnStatement) => {
          log(
            "Inserting Vizbee initialization code into didFinishLaunchingWithOptions"
          );
          return `${methodStart}\n${codeToAdd}${returnStatement}`;
        }
      );
    }

    // Add the getLayoutsConfig method if not already present
    if (layoutConfig && !appDelegate.contents.includes("getLayoutsConfig")) {
      const classEndIndex = appDelegate.contents.lastIndexOf("}");
      if (classEndIndex !== -1) {
        appDelegate.contents =
          appDelegate.contents.slice(0, classEndIndex) +
          getLayoutsConfigMethod +
          "\n}";
        log("Added getLayoutsConfig method to AppDelegate");
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
const withVizbeeInitialization: ConfigPlugin<{
  vizbeeAppId: string;
  layoutConfigFilePath?: string;
  language?: "objcpp" | "swift";
}> = (
  config,
  { vizbeeAppId, layoutConfigFilePath = null, language = "objcpp" }
) => {
  return withAppDelegate(config, (config) => {
    const {
      projectRoot,
      projectName = path.basename(getSourceRoot(projectRoot)),
    } = config.modRequest;
    let layoutConfig = null;

    if (layoutConfigFilePath) {
      if (fs.existsSync(layoutConfigFilePath)) {
        const fileContents = fs.readFileSync(layoutConfigFilePath, "utf8");
        layoutConfig = JSON.parse(fileContents);
      } else {
        throw new Error(
          `Could not find layout config file at path: ${layoutConfigFilePath}`
        );
      }
    }
    config.modResults = modifyAppDelegate(
      config.userInterfaceStyle || "light",
      config.modResults,
      projectName,
      vizbeeAppId,
      layoutConfig,
      language
    );
    log("Modified AppDelegate with Vizbee initialization");
    return config;
  });
};

export default withVizbeeInitialization;
