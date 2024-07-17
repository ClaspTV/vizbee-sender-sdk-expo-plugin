const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

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
        console.log(`Adding resource file ${fontFile}`);

        await fs.copyFileSync(sourceFile, destinationFile);
      }
      console.log("Resource files copied successfully.");
      return config;
    },
  ]);
}

module.exports = withFonts;
