const { withAppDelegate } = require("@expo/config-plugins");

function addCodeToApplicationDidBecomeActive(
  theme,
  appDelegate,
  hasLayoutConfig = false,
  language = "objcpp"
) {
  if(theme != "automatic"){
    return;
  }
  const applicationDidBecomeActiveRegex =
    language === "objcpp"
      ? /- \(void\)applicationDidBecomeActive:\(UIApplication \*\)application/
      : /func applicationDidBecomeActive\(_ application: UIApplication\)/;

  let codeToAdd;
  if (language === "objcpp") {
    if (hasLayoutConfig) {
      codeToAdd = `
    if(UIApplication.sharedApplication.windows.firstObject.traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark){
        [Vizbee setUIConfig:[VizbeeStyles darkTheme] layouts:[self getLayoutsConfig]];
    }else{
        [Vizbee setUIConfig:[VizbeeStyles lightTheme] layouts:[self getLayoutsConfig]];
    }`;
    } else {
      codeToAdd = `
    if(UIApplication.sharedApplication.windows.firstObject.traitCollection.userInterfaceStyle == UIUserInterfaceStyleDark){
        [Vizbee setUIConfig:[VizbeeStyles darkTheme]];
    }else{
        [Vizbee setUIConfig:[VizbeeStyles lightTheme]];
    }`;
    }
  } else if (language === "swift") {
    if (hasLayoutConfig) {
      codeToAdd = `
    if UIApplication.shared.windows.first?.traitCollection.userInterfaceStyle == .dark {
        Vizbee.setUIConfig(VizbeeStyles.darkTheme, layouts: getLayoutsConfig())
    } else {
        Vizbee.setUIConfig(VizbeeStyles.lightTheme, layouts: getLayoutsConfig())
    }`;
    } else {
      codeToAdd = `
    if UIApplication.shared.windows.first?.traitCollection.userInterfaceStyle == .dark {
        Vizbee.setUIConfig(VizbeeStyles.darkTheme)
    } else {
        Vizbee.setUIConfig(VizbeeStyles.lightTheme)
    }`;
    }
  }

  if (applicationDidBecomeActiveRegex.test(appDelegate.contents)) {
    return appDelegate.contents.replace(
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
      const methodToAdd = `func applicationDidBecomeActive(_ application: UIApplication) {\n${codeToAdd}\n}`;
      const classEndIndex = appDelegate.contents.lastIndexOf("}");
      if (classEndIndex !== -1) {
        appDelegate.contents =
          appDelegate.contents.slice(0, classEndIndex) + methodToAdd + "\n}";
      }
    }
    return appDelegate;
  }
}

const withVizbeeConfig = (config, { hasLayoutConfig, language }) => {
  return withAppDelegate(config, (config) => {
    config.modResults = addCodeToApplicationDidBecomeActive(
      config.userInterfaceStyle,
      config.modResults,
      hasLayoutConfig,
      language
    );
    return config;
  });
};

module.exports = withVizbeeConfig;
