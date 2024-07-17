const {
  withAndroidManifest,
  withInfoPlist,
  withXcodeProject,
  IOSConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");
const { getAppDelegateFilePath } = IOSConfig.Paths;

function withFonts(
  config,
  { fontFolder = `${config._internal.projectRoot}/assets/fonts`, target = null }
) {
  // Function to read all font files from the specified folder
  function getFontFiles(folderPath) {
    const files = fs.readdirSync(folderPath);
    return files.filter((file) => {
      return (
        fs.statSync(path.join(folderPath, file)).isFile() &&
        /\.(ttf|otf)$/.test(file)
      ); // Filter only font files
    });
  }

  const fonts = getFontFiles(fontFolder);

  // iOS: Modify Info.plist and Xcode project
  config = withInfoPlist(config, (config) => {
    config.modResults.UIAppFonts = [
      ...(config.modResults.UIAppFonts || []),
      ...fonts.map((fontFile) => `${fontFile.toLowerCase()}`), // Relative path to font files
    ];
    return config;
  });

  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const { projectName, projectRoot } = config.modRequest;

    const targetName = target || projectName;

    // Resolve the target
    const nativeTargets = xcodeProject.pbxNativeTargetSection();

    const targetEntry = Object.entries(nativeTargets).find(
      ([, value]) => value.name === targetName
    );

    if (!targetEntry) {
      throw new Error(`Cannot find target named ${targetName}`);
    }
    const [targetId] = targetEntry;

    // The directory where new source files should be copied to
    const sourceDir = path.dirname(getAppDelegateFilePath(projectRoot));

    // Copy font files to the destination directory
    for (const fontFile of fonts) {
      const sourceFile = path.join(fontFolder, fontFile);
      const destinationFile = path.join(sourceDir, fontFile.toLowerCase());
      await fs.copyFileSync(sourceFile, destinationFile);

      console.log(`Adding resource file ${fontFile}`);
      config.modResults = IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: destinationFile,
        groupName: targetName,
        project: xcodeProject,
        isBuildFile: true,
        verbose: true,
        targetUuid: targetId,
      });
    }
    console.log("Resource files copied successfully.");

    return config;
  });

  return config;
}

module.exports = withFonts;
