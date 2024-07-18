import {
  ConfigPlugin,
  withInfoPlist,
  withXcodeProject,
  IOSConfig,
} from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import { log } from "../helper";

const { getAppDelegateFilePath, getSourceRoot } = IOSConfig.Paths;

/**
 * Retrieves all font files (ttf, otf) from a specified folder path.
 * @param folderPath - The path to the folder containing font files.
 * @returns An array of font file names.
 */
function getFontFiles(folderPath: string): string[] {
  return fs.readdirSync(folderPath).filter((file) => {
    return (
      fs.statSync(path.join(folderPath, file)).isFile() &&
      /\.(ttf|otf)$/i.test(file)
    );
  });
}

/**
 * A config plugin that adds custom fonts to an Expo project for both iOS and Android.
 * @param config - The Expo config object.
 * @param options - Font configuration options.
 * @returns The modified config object.
 */
const withFonts: ConfigPlugin<{ fontFolder?: string; target?: string }> = (
  config,
  { fontFolder, target = null }
) => {
  config = withInfoPlist(config, (config) => {
    const { projectRoot } = config.modRequest;
    fontFolder = fontFolder || `${projectRoot}/assets/fonts`;

    // Get all font files from the specified folder
    const fonts = getFontFiles(fontFolder);

    const existingFonts = (config.modResults.UIAppFonts as string[]) || [];
    config.modResults.UIAppFonts = [
      ...existingFonts,
      ...fonts.map((fontFile: string) => fontFile.toLowerCase()), // Relative path to font files
    ];
    return config;
  });

  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const {
      projectRoot,
      projectName = path.basename(getSourceRoot(projectRoot)),
    } = config.modRequest;
    fontFolder = fontFolder || `${projectRoot}/assets/fonts`;

    // Get all font files from the specified folder
    const fonts = getFontFiles(fontFolder);

    const targetName = target || projectName;

    // Resolve the target
    const nativeTargets = xcodeProject.pbxNativeTargetSection();

    const targetEntry = Object.entries(nativeTargets).find(
      ([, value]: [string, any]) => value.name === targetName
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

      try {
        await fs.promises.copyFile(sourceFile, destinationFile);
        log(`Adding resource file ${fontFile} to iOS`);
        IOSConfig.XcodeUtils.addResourceFileToGroup({
          filepath: destinationFile,
          groupName: targetName,
          project: xcodeProject,
          isBuildFile: true,
          verbose: true,
          targetUuid: targetId,
        });
      } catch (error) {
        console.error(`Failed to copy font file ${fontFile}:`, error);
      }
    }
    log("Resource files copied successfully.");

    return config;
  });

  return config;
};

export default withFonts;
