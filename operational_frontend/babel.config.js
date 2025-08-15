module.exports = function(api) {
  // Use conditional caching to avoid conflicts
  api.cache.using(() => process.env.NODE_ENV);

  const isWeb = api.caller(caller => {
    return caller && caller.name === 'babel-loader';
  });

  if (isWeb) {
    return {
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: ['last 2 versions', 'not dead', '> 0.2%'],
          },
        }],
        ['@babel/preset-react', {
          runtime: 'automatic',
        }],
        '@babel/preset-typescript',
      ],
      plugins: [
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        ['@babel/plugin-proposal-class-properties', { loose: true }],
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-transform-runtime',
        [
          'module:react-native-dotenv',
          {
            moduleName: '@env',
            path: '.env',
            blocklist: null,
            allowlist: null,
            safe: false,
            allowUndefined: true,
          },
        ],
      ],
    };
  }

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
