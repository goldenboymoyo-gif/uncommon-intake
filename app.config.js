// Expo Go can only open a project that reports its Expo SDK version. The EAS Update settings in
// app.json (runtimeVersion, updates) replace that with the app version, so drop them when the
// dev server is started for Expo Go with `npm run go` (which sets EXPO_GO=1). Real builds keep them.
// Android push needs google-services.json. It is kept out of git; EAS builds get it from the
// GOOGLE_SERVICES_JSON file environment variable, local runs use the file in this folder.
module.exports = ({ config }) => {
  const android = { ...config.android, googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json' };
  if (process.env.EXPO_GO !== '1') return { ...config, android };
  const { runtimeVersion, updates, ...rest } = config;
  return { ...rest, android };
};
