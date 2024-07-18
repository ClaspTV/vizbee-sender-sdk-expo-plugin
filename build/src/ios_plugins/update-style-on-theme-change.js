"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const helper_1 = require("../helper");
/**
 * Adds the required code to the `applicationDidBecomeActive` method in the AppDelegate.
 * @param theme - The user interface style theme.
 * @param appDelegate - The AppDelegate contents to modify.
 * @param hasLayoutConfig - Whether the layout configuration is present.
 * @param language - The programming language (either "objcpp" or "swift").
 * @returns The modified AppDelegate contents.
 */
function addCodeToApplicationDidBecomeActive(theme, appDelegate, hasLayoutConfig = false, language = "objcpp") {
    if (theme !== "automatic") {
        return appDelegate;
    }
    (0, helper_1.log)("Modifying AppDelegate for Vizbee configuration.");
    (0, helper_1.log)("Adding code to applicationDidBecomeActive with theme:", theme);
    const applicationDidBecomeActiveRegex = language === "objcpp"
        ? /- \(void\)applicationDidBecomeActive:\(UIApplication \*\)application/
        : /func applicationDidBecomeActive\(_ application: UIApplication\)/;
    let codeToAdd = "";
    if (language === "objcpp") {
        if (hasLayoutConfig) {
            codeToAdd = `
    if (UIApplication.sharedApplication.windows.firstObject.traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark) {
        [Vizbee setUIConfig:[VizbeeStyles darkTheme] layouts:[self getLayoutsConfig]];
    } else {
        [Vizbee setUIConfig:[VizbeeStyles lightTheme] layouts:[self getLayoutsConfig]];
    }`;
        }
        else {
            codeToAdd = `
    if (UIApplication.sharedApplication.windows.firstObject.traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark) {
        [Vizbee setUIConfig:[VizbeeStyles darkTheme]];
    } else {
        [Vizbee setUIConfig:[VizbeeStyles lightTheme]];
    }`;
        }
    }
    else if (language === "swift") {
        if (hasLayoutConfig) {
            codeToAdd = `
    if UIApplication.shared.windows.first?.traitCollection.userInterfaceStyle == .dark {
        Vizbee.setUIConfig(VizbeeStyles.darkTheme, layouts: getLayoutsConfig())
    } else {
        Vizbee.setUIConfig(VizbeeStyles.lightTheme, layouts: getLayoutsConfig())
    }`;
        }
        else {
            codeToAdd = `
    if UIApplication.shared.windows.first?.traitCollection.userInterfaceStyle == .dark {
        Vizbee.setUIConfig(VizbeeStyles.darkTheme)
    } else {
        Vizbee.setUIConfig(VizbeeStyles.lightTheme)
    }`;
        }
    }
    if (applicationDidBecomeActiveRegex.test(appDelegate.contents)) {
        appDelegate.contents = appDelegate.contents.replace(applicationDidBecomeActiveRegex, (match) => `${match} {\n${codeToAdd}`);
    }
    else {
        if (language === "objcpp") {
            const methodToAdd = `- (void)applicationDidBecomeActive:(UIApplication *)application {\n${codeToAdd}\n}`;
            const endIndex = appDelegate.contents.lastIndexOf("@end");
            if (endIndex !== -1) {
                appDelegate.contents =
                    appDelegate.contents.slice(0, endIndex) + methodToAdd + "\n\n@end";
            }
        }
        else {
            const methodToAdd = `func applicationDidBecomeActive(_ application: UIApplication) {\n${codeToAdd}\n}`;
            const classEndIndex = appDelegate.contents.lastIndexOf("}");
            if (classEndIndex !== -1) {
                appDelegate.contents =
                    appDelegate.contents.slice(0, classEndIndex) + methodToAdd + "\n}";
            }
        }
    }
    (0, helper_1.log)("AppDelegate modified successfully.");
    return appDelegate;
}
/**
 * A config plugin to modify the AppDelegate to add Vizbee configuration.
 * @param config - The Expo config object.
 * @param options - Options for the plugin.
 * @param options.hasLayoutConfig - Whether the layout configuration is present.
 * @param options.language - The programming language (either "objcpp" or "swift").
 * @returns The modified config object.
 */
const withVizbeeConfig = (config, { hasLayoutConfig, language }) => {
    return (0, config_plugins_1.withAppDelegate)(config, (config) => {
        config.modResults = addCodeToApplicationDidBecomeActive(config.userInterfaceStyle || "light", config.modResults, hasLayoutConfig, language);
        return config;
    });
};
exports.default = withVizbeeConfig;
