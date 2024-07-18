import {
  ConfigPlugin,
  withDangerousMod,
  withPlugins,
} from "@expo/config-plugins";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import fs from "fs";
import path from "path";
import { log } from "../helper";

/**
 * Asynchronously reads the content of a file.
 * @param filePath - The path to the file.
 * @returns A promise that resolves to the file content as a string.
 */
async function readFileAsync(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, "utf8");
}

/**
 * Asynchronously writes content to a file.
 * @param filePath - The path to the file.
 * @param content - The content to write.
 * @returns A promise that resolves when the file is written.
 */
async function saveFileAsync(filePath: string, content: string): Promise<void> {
  return fs.promises.writeFile(filePath, content, "utf8");
}

/**
 * A config plugin that adds custom pod sources to the Podfile.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withAddPodSource: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, "Podfile");
      const contents = await readFileAsync(file);
      await saveFileAsync(file, addPodSource(contents));
      return config;
    },
  ]);
};

/**
 * Adds custom pod sources to the Podfile content.
 * @param src - The original Podfile content.
 * @returns The modified Podfile content.
 */
function addPodSource(src: string): string {
  log(`Adding custom pod sources to Podfile`);
  return mergeContents({
    tag: `rn-add-pod-source`,
    src,
    newSrc: `source "https://git.vizbee.tv/Vizbee/Specs.git"\nsource "https://github.com/CocoaPods/Specs.git"`,
    anchor: /^/,
    offset: 0,
    comment: "#",
  }).contents;
}

/**
 * A config plugin that applies multiple plugins including withAddPodSource.
 * @param config - The Expo config object.
 * @returns The modified config object.
 */
const withCustomPlugins: ConfigPlugin = (config) =>
  withPlugins(config, [withAddPodSource]);

export default withCustomPlugins;
