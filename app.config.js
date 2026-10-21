// Expo Go can only open a project that reports its Expo SDK version. The EAS Update settings in
// app.json (runtimeVersion, updates) replace that with the app version, so drop them when the
// dev server is started for Expo Go with `npm run go` (which sets EXPO_GO=1). Real builds keep them.
module.exports = ({ config }) => {
  if (process.env.EXPO_GO !== '1') return config;
  const { runtimeVersion, updates, ...rest } = config;
  return rest;
};
