const { withDangerousMod, withPlugins } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

async function readFileAsync(filePath) {
  return fs.promises.readFile(filePath, "utf8");
}

async function saveFileAsync(filePath, content) {
  return fs.promises.writeFile(filePath, content, "utf8");
}

const withAddMavenUrl = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const file = path.join(
        config.modRequest.platformProjectRoot,
        "build.gradle"
      );
      const contents = await readFileAsync(file);
      const newContents = addMavenUrl(contents);
      await saveFileAsync(file, newContents);
      return config;
    },
  ]);
};

function addMavenUrl(src) {
  const allProjectsMatch = src.match(/allprojects\s*{[\s\S]*?}\s}/);

  if (allProjectsMatch) {
    const allProjectsContent = allProjectsMatch[0];
    const repositoriesMatch = allProjectsContent.match(
      /repositories\s*{([\s\S]*?)}\s}/
    );

    if (repositoriesMatch) {
      const repositoriesContent = repositoriesMatch[0]; // Extracting the content inside repositories

      const updatedRepositoriesContent = repositoriesContent.replace(
        "{",
        `{\n maven { url 'https://repo.claspws.tv/artifactory/libs' }\n`
      );

      const updatedAllProjectsContent = allProjectsContent.replace(
        /repositories\s*{([\s\S]*?)}\s}/,
        updatedRepositoriesContent
      );

      return src.replace(
        /allprojects\s*{([\s\S]*?)}\s}/,
        updatedAllProjectsContent
      );
    } else {
      // If repositories block doesn't exist, add it with Maven URL
      return src.replace(
        /allprojects\s*{([\s\S]*?)}/,
        `allprojects {\n    repositories {\n        maven { url 'https://repo.claspws.tv/artifactory/libs' }\n    }\n}`
      );
    }
  } else {
    // If allprojects block doesn't exist, add it with repositories and Maven URL
    return `${src}\nallprojects {\n    repositories {\n        maven { url 'https://repo.claspws.tv/artifactory/libs' }\n    }\n}`;
  }
}

module.exports = (config) => withPlugins(config, [withAddMavenUrl]);
