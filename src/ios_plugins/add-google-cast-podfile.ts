import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import fs from "fs";
import path from "path";

const withGoogleCastSDK: ConfigPlugin<{ googleCastVersion?: string }> = (
  config,
  { googleCastVersion = "4.8.0" }
) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfileContent = await fs.promises.readFile(podfilePath, "utf-8");

      podfileContent = mergeContents({
        src: podfileContent,
        newSrc: `  pod 'google-cast-sdk-no-bluetooth-dynamic', '~> ${googleCastVersion}'`,
        anchor: /use_react_native!/,
        offset: 0,
        tag: "rn-add-google-cast",
        comment: "#",
      }).contents;

      await fs.promises.writeFile(podfilePath, podfileContent);

      return config;
    },
  ]);
};

export default withGoogleCastSDK;
