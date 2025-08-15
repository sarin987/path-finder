const { getDefaultConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
module.exports = (() => {
  const defaultConfig = getDefaultConfig(__dirname);

  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      assetExts: [
        ...defaultConfig.resolver.assetExts,
        'png',
        'jpg',
        'jpeg',
        'gif',
        'svg',
        'json', // For Lottie files
      ],
      sourceExts: [...defaultConfig.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx', 'cjs'],
    },
    transformer: {
      ...defaultConfig.transformer,
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
  };
})();
