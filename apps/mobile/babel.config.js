module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 ships its worklets babel plugin separately; must be last.
    plugins: ["react-native-worklets/plugin"],
  };
};
