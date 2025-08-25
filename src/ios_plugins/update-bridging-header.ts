import {
  ConfigPlugin,
  withXcodeProject,
  IOSConfig,
} from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import { log } from "../helper";

const { getSourceRoot } = IOSConfig.Paths;

const VIZBEE_IMPORT = "#import <RNVizbeeSenderSdk/VizbeeBootstrap.h>";

const BRIDGING_HEADER_TEMPLATE = `//
// Use this file to import your target's public headers that you would like to expose to Swift.
//
${VIZBEE_IMPORT}
`;

/**
 * Updates or creates a bridging header file with the Vizbee import for Swift projects.
 * @param config - The Expo config object
 * @param language - The language of the project ("swift" or "objcpp")
 * @returns The modified config object
 */
export const updateBridgingHeader: ConfigPlugin<{
  language?: "objcpp" | "swift";
}> = (config, { language = "objcpp" }) => {
  // Only process for Swift projects
  if (language !== "swift") {
    return config;
  }

  return withXcodeProject(config, (config) => {
    const {
      projectRoot,
      projectName = path.basename(getSourceRoot(projectRoot)),
    } = config.modRequest;
    const sourceRoot = getSourceRoot(projectRoot);

    // Common bridging header file names
    const possibleBridgingHeaderNames = [
      `${projectName}-Bridging-Header.h`,
      "Bridging-Header.h",
      `${projectName.replace(/\s+/g, "")}-Bridging-Header.h`,
    ];

    let bridgingHeaderPath: string | null = null;

    // Check if any bridging header exists
    for (const headerName of possibleBridgingHeaderNames) {
      const fullPath = path.join(sourceRoot, headerName);
      if (fs.existsSync(fullPath)) {
        bridgingHeaderPath = fullPath;
        log(`Found existing bridging header: ${headerName}`);
        break;
      }
    }

    // If no bridging header exists, create one
    if (!bridgingHeaderPath) {
      bridgingHeaderPath = path.join(
        sourceRoot,
        `${projectName}-Bridging-Header.h`
      );
      log(`Creating new bridging header: ${path.basename(bridgingHeaderPath)}`);

      // Create the bridging header with the template
      fs.writeFileSync(bridgingHeaderPath, BRIDGING_HEADER_TEMPLATE);
      log("Created bridging header with Vizbee import");
    } else {
      // Update existing bridging header
      const existingContent = fs.readFileSync(bridgingHeaderPath, "utf8");

      // Check if the Vizbee import already exists
      if (!existingContent.includes(VIZBEE_IMPORT)) {
        const updatedContent = existingContent + `\n${VIZBEE_IMPORT}\n`;
        fs.writeFileSync(bridgingHeaderPath, updatedContent);
        log("Added Vizbee import to existing bridging header");
      } else {
        log("Vizbee import already exists in bridging header");
      }
    }

    // Update Xcode project to reference the bridging header
    const project = config.modResults;
    const bridgingHeaderName = path.basename(bridgingHeaderPath);

    // Get all build configurations
    const configurations = project.pbxXCBuildConfigurationSection();

    if (configurations) {
      Object.keys(configurations).forEach((key) => {
        const config = configurations[key];
        if (config.buildSettings && !config.name) {
          // This is a build configuration, not a reference
          if (!config.buildSettings.SWIFT_OBJC_BRIDGING_HEADER) {
            config.buildSettings.SWIFT_OBJC_BRIDGING_HEADER = `$(SRCROOT)/${bridgingHeaderName}`;
            log(`Set SWIFT_OBJC_BRIDGING_HEADER to ${bridgingHeaderName}`);
          }
        }
      });
    }

    return config;
  });
};

export default updateBridgingHeader;
