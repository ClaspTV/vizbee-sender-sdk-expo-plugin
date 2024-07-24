import {
  ConfigPlugin,
  withXcodeProject,
  IOSConfig,
} from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import { log } from "../helper";

const { getAppDelegateFilePath } = IOSConfig.Paths;

/**
 * Retrieves the main group for a specific target in an Xcode project.
 * @param project - The Xcode project instance.
 * @param targetName - The name of the target.
 * @returns The main group object if found; otherwise, null.
 */
function getMainGroupForTarget(project: any, targetName?: string): any {
  if (targetName) {
    const mainGroup = project.pbxGroupByName(targetName);
    return mainGroup;
  }
  return null;
}

/**
 * A config plugin that adds VizbeeStyles.swift file to an Xcode project.
 * @param config - The Expo config object.
 * @param props - Additional properties.
 * @returns The modified config object.
 */
const withAddVizbeeStylesFile: ConfigPlugin<{ target?: string }> = (
  config,
  props
) => {
  return withXcodeProject(config, async (config) => {
    const { target = config.modRequest.projectName } = props || {};
    const swiftFilePath = `${config.modRequest.projectRoot}/vizbee_resources/ios/VizbeeStyles.swift`;

    log(`Adding VizbeeStyles.swift file to Xcode project`);

    // Check if the file exists
    try {
      await fs.promises.access(swiftFilePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`Cannot find ${swiftFilePath}. Please ensure it exists.`);
    }

    // Read the Swift file content
    const swiftFileContent = fs.readFileSync(swiftFilePath, "utf-8");

    // Add or modify the Xcode project
    if (!config.modResults) {
      throw new Error(`Failed to modify Xcode project.`);
    }

    // Get the Xcode project "key" that the new file entries will be added to
    const xcodeProject = config.modResults;
    const { projectRoot } = config.modRequest;

    // Resolve the target
    const nativeTargets = xcodeProject.pbxNativeTargetSection();

    const targetEntry = Object.entries(nativeTargets).find(
      ([, value]: [string, any]) => value.name === target
    );

    if (!targetEntry) {
      throw new Error(`Cannot find target named ${target}`);
    }
    const [targetId] = targetEntry;

    // The directory where new source files should be copied to
    const sourceDir = path.dirname(getAppDelegateFilePath(projectRoot));
    const destinationDir = path.join(sourceDir, "Vizbee");

    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }

    const fileName = `VizbeeStyles.swift`;
    fs.writeFileSync(path.join(destinationDir, fileName), swiftFileContent);

    const group = xcodeProject.pbxCreateGroup("Vizbee", `${target}/Vizbee`);
    const mainGroup = getMainGroupForTarget(xcodeProject, target);
    mainGroup.children.push({
      value: group,
      comment: "Vizbee",
    });

    xcodeProject.addSourceFile(fileName, { target: targetId }, group);

    return config;
  });
};

export default withAddVizbeeStylesFile;
