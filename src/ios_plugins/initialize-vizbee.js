const { withAppDelegate } = require("@expo/config-plugins");
const fs = require("fs");

function appendImportIfNeeded(contents, importStatement) {
  if (!contents.includes(importStatement)) {
    const match = contents.match(/#import "AppDelegate.h"/);
    if (match) {
      const insertPosition = match.index + match[0].length;
      contents =
        contents.slice(0, insertPosition) +
        `\n${importStatement}` +
        contents.slice(insertPosition);
    }
  }
  return contents;
}

function appendSwiftImportIfNeeded(contents, importStatement) {
  if (!contents.includes(importStatement)) {
    const match = contents.match(/import UIKit/);
    if (match) {
      const insertPosition = match.index + match[0].length;
      contents =
        contents.slice(0, insertPosition) +
        `\n${importStatement}` +
        contents.slice(insertPosition);
    }
  }
  return contents;
}

function modifyAppDelegate(
  theme,
  appDelegate,
  projectName,
  vizbeeAppId,
  layoutConfig,
  language
) {
  console.log({ theme });
  if (!vizbeeAppId) {
    throw new Error(`Cannot find vizbeeAppId in params it is mandatory`);
  }

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
- (VZBLayoutsConfig *)getLayoutsConfig{
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
      }
    }
  }

  return appDelegate;
}

const withVizbeeInitialization = (
  config,
  { theme, vizbeeAppId, layoutConfigFilePath = null, language = "objcpp" }
) => {
  return withAppDelegate(config, (config) => {
    const { projectName } = config.modRequest;
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
      config.userInterfaceStyle,
      config.modResults,
      projectName,
      vizbeeAppId,
      layoutConfig,
      language
    );
    return config;
  });
};

module.exports = withVizbeeInitialization;
