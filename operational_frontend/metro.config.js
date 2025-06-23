const { getDefaultConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = (() => {
  const defaultConfig = getDefaultConfig(__dirname);
  
  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      assetExts: [...defaultConfig.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'svg'],
    },
    transformer: {
      ...defaultConfig.transformer,
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  };
})();
