const { withXcodeProject, IOSConfig } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");
const { getAppDelegateFilePath } = IOSConfig.Paths;

function getMainGroupForTarget(project, targetName) {
  if (targetName) {
    const mainGroup = project.pbxGroupByName(targetName);
    return mainGroup;
  }
  return null;
}

const withAddVizbeeStylesFile = (config, props) => {
  return withXcodeProject(config, async (config) => {
    const {
      swiftFilePath = `${config.modRequest.projectRoot}/vizbee_resources/ios/VizbeeStyles.swift`,
    } = props;
    const name = "VizbeeStyles";
    const folderName = "Vizbee";

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
    const { projectName, projectRoot } = config.modRequest;

    // Resolve the target
    const nativeTargets = xcodeProject.pbxNativeTargetSection();

    const targetName = props.target || projectName;

    const targetEntry = Object.entries(nativeTargets).find(
      ([, value]) => value.name === targetName
    );

    if (!targetEntry) {
      throw new Error(`Cannot find target named ${targetName}`);
    }
    const [targetId] = targetEntry;

    // The directory where new source files should be copied to
    const sourceDir = path.dirname(getAppDelegateFilePath(projectRoot));
    const destinationDir = path.join(sourceDir, folderName);
    if (!fs.existsSync(destinationDir)) {
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(destinationDir, `${name}.swift`),
      swiftFileContent
    );

    const group = xcodeProject.pbxCreateGroup(
      folderName,
      `${targetName}/${folderName}`
    );
    var mainGroup = getMainGroupForTarget(xcodeProject, targetName);
    mainGroup.children.push({
      value: group,
      comment: folderName,
    });

    xcodeProject.addSourceFile(`${name}.swift`, { target: targetId }, group);

    return config;
  });
};

module.exports = withAddVizbeeStylesFile;
