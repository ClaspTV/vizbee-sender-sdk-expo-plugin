export interface VizbeePluginOptions {
  fontFolder?: string;
  vizbeeAppId: string;
  chromecastAppId: string;
  layoutConfigFilePath?: string;
  ios?: {
    target?: string;
    lnaPermissionText?: string;
    language?: "objcpp" | "swift";
  };
  android?: {
    language?: "kotlin" | "java";
  };
}
