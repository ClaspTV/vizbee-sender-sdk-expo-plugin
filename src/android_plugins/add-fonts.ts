import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import { log } from "../helper";

/**
 * A config plugin to copy custom font files to the Android project.
 * @param config - The Expo config object.
 * @param options - Options for the plugin.
 * @param options.fontFolder - The folder containing the font files. Defaults to `assets/fonts` in the project root.
 * @param options.target - The target location for the font files. Currently not used.
 * @returns The modified config object.
 */
const withFonts: ConfigPlugin<{
  fontFolder?: string;
}> = (
  config,
  { fontFolder = `${config._internal?.projectRoot}/assets/fonts` }
) => {
  /**
   * Reads all font files from the specified folder.
   * @param folderPath - The path to the folder containing the font files.
   * @returns An array of font file names.
   */
  function getFontFiles(folderPath: string): string[] {
    const files = fs.readdirSync(folderPath);
    return files.filter((file) => {
      return (
        fs.statSync(path.join(folderPath, file)).isFile() &&
        /\.(ttf|otf)$/.test(file)
      ); // Filter only font files
    });
  }

  return withDangerousMod(config, [
    "android",
    async (config) => {
      const fontsDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "font"
      );

      // Ensure the font directory exists
      if (!fs.existsSync(fontsDir)) {
        fs.mkdirSync(fontsDir, { recursive: true });
      }

      const fonts = getFontFiles(fontFolder);

      // Copy font files to the destination directory
      for (const fontFile of fonts) {
        const sourceFile = path.join(fontFolder, fontFile);
        const destinationFile = path.join(fontsDir, fontFile.toLowerCase());
        log(`Adding resource file ${fontFile} to android`);

        await fs.promises.copyFile(sourceFile, destinationFile);
      }
      log("Resource files copied successfully.");
      return config;
    },
  ]);
};

export default withFonts;
