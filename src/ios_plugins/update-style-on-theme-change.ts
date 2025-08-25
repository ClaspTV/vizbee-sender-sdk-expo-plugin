import { ConfigPlugin, withAppDelegate } from "@expo/config-plugins";
import { log } from "../helper";

/**
 * Adds the required code to the `applicationDidBecomeActive` method in the AppDelegate.
 * @param theme - The user interface style theme.
 * @param appDelegate - The AppDelegate contents to modify.
 * @param hasLayoutConfig - Whether the layout configuration is present.
 * @param language - The programming language (either "objcpp" or "swift").
 * @returns The modified AppDelegate contents.
 */
function addCodeToApplicationDidBecomeActive(
  theme: "light" | "dark" | "automatic",
  appDelegate: { contents: string },
  hasLayoutConfig = false,
  language = "objcpp"
): any {
  if (theme !== "automatic") {
    return appDelegate;
  }
  log("Modifying AppDelegate for Vizbee configuration.");

  log("Adding code to applicationDidBecomeActive with theme:", theme);

  const applicationDidBecomeActiveRegex =
    language === "objcpp"
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
    } else {
      codeToAdd = `
    if (UIApplication.sharedApplication.windows.firstObject.traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark) {
        [Vizbee setUIConfig:[VizbeeStyles darkTheme]];
    } else {
        [Vizbee setUIConfig:[VizbeeStyles lightTheme]];
    }`;
    }
  } else if (language === "swift") {
    if (hasLayoutConfig) {
      codeToAdd = `
    let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene
    if scene?.windows.first?.traitCollection.userInterfaceStyle == .dark {
        Vizbee.setUIConfig(VizbeeStyles.darkTheme, layouts: getLayoutsConfig())
    } else {
        Vizbee.setUIConfig(VizbeeStyles.lightTheme, layouts: getLayoutsConfig())
    }`;
    } else {
      codeToAdd = `
    let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene
    if scene?.windows.first?.traitCollection.userInterfaceStyle == .dark {
        Vizbee.setUIConfig(VizbeeStyles.darkTheme)
    } else {
        Vizbee.setUIConfig(VizbeeStyles.lightTheme)
    }`;
    }
  }

  if (applicationDidBecomeActiveRegex.test(appDelegate.contents)) {
    appDelegate.contents = appDelegate.contents.replace(
      applicationDidBecomeActiveRegex,
      (match) => `${match} {\n${codeToAdd}`
    );
  } else {
    if (language === "objcpp") {
      const methodToAdd = `- (void)applicationDidBecomeActive:(UIApplication *)application {\n${codeToAdd}\n}`;
      const endIndex = appDelegate.contents.lastIndexOf("@end");
      if (endIndex !== -1) {
        appDelegate.contents =
          appDelegate.contents.slice(0, endIndex) + methodToAdd + "\n\n@end";
      }
    } else {
      // Swift: Find the AppDelegate class and insert before its closing brace
      const methodToAdd = `\n  public override func applicationDidBecomeActive(_ application: UIApplication) {\n${codeToAdd}\n  }\n`;

      // Look for the AppDelegate class declaration
      const appDelegateClassRegex = /public\s+class\s+AppDelegate[^{]*\{/;
      const appDelegateMatch = appDelegate.contents.match(
        appDelegateClassRegex
      );

      if (appDelegateMatch) {
        // Find the matching closing brace for the AppDelegate class
        let braceCount = 0;
        const startIndex =
          (appDelegateMatch.index ?? 0) + appDelegateMatch[0].length;
        let insertIndex = -1;

        for (let i = startIndex; i < appDelegate.contents.length; i++) {
          if (appDelegate.contents[i] === "{") {
            braceCount++;
          } else if (appDelegate.contents[i] === "}") {
            if (braceCount === 0) {
              // This is the closing brace of the AppDelegate class
              insertIndex = i;
              break;
            }
            braceCount--;
          }
        }

        if (insertIndex !== -1) {
          appDelegate.contents =
            appDelegate.contents.slice(0, insertIndex) +
            methodToAdd +
            appDelegate.contents.slice(insertIndex);
        } else {
          // Fallback: insert before the last closing brace
          const classEndIndex = appDelegate.contents.lastIndexOf("}");
          if (classEndIndex !== -1) {
            appDelegate.contents =
              appDelegate.contents.slice(0, classEndIndex) + methodToAdd + "}";
          }
        }
      } else {
        // Fallback: insert before the last closing brace
        const classEndIndex = appDelegate.contents.lastIndexOf("}");
        if (classEndIndex !== -1) {
          appDelegate.contents =
            appDelegate.contents.slice(0, classEndIndex) + methodToAdd + "}";
        }
      }
    }
  }
  log("AppDelegate modified successfully.");

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
const withVizbeeConfig: ConfigPlugin<{
  hasLayoutConfig: boolean;
  language?: "objcpp" | "swift";
}> = (config, { hasLayoutConfig, language }) => {
  return withAppDelegate(config, (config) => {
    config.modResults = addCodeToApplicationDidBecomeActive(
      config.userInterfaceStyle || "light",
      config.modResults,
      hasLayoutConfig,
      language
    );
    return config;
  });
};

export default withVizbeeConfig;
