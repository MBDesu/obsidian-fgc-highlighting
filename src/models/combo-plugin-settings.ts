export interface ButtonProfile {
  blockName: string;
  gameName: string;
  buttonColors: { [button: string]: string };
  specialPrefixes?: { [prefix: string]: string };
  delimeters: string; 
}

export interface ComboPluginSettings {
  buttonProfiles: ButtonProfile[];
}
