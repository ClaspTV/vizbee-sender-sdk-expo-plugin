const { withDangerousMod, withPlugins } = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");
const fs = require("fs");
const path = require("path");

async function readFileAsync(path) {
  return fs.promises.readFile(path, "utf8");
}

async function saveFileAsync(path, content) {
  return fs.promises.writeFile(path, content, "utf8");
}

const withAddPodSource = (c) => {
  return withDangerousMod(c, [
    "ios",
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, "Podfile");
      const contents = await readFileAsync(file);
      await saveFileAsync(file, addPodSource(contents));
      return config;
    },
  ]);
};

function addPodSource(src) {
  return mergeContents({
    tag: "rn-add-pod-source",
    src,
    newSrc: `source "https://git.vizbee.tv/Vizbee/Specs.git"\nsource "https://github.com/CocoaPods/Specs.git"`,
    anchor: /^/,
    offset: 0,
    comment: "#",
  }).contents;
}

module.exports = (config) => withPlugins(config, [withAddPodSource]);
