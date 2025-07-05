const path = require('path');

module.exports = {
  babel: {
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
    ],
  },
  devServer: {
    hot: false,
  },
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          // Disable React Refresh completely
          webpackConfig.plugins = webpackConfig.plugins.filter(
            plugin => !plugin.constructor.name.includes('ReactRefresh')
          );
          return webpackConfig;
        },
      },
    },
  ],
  webpack: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-linear-gradient$': 'react-native-web-linear-gradient',
      'react-native-vector-icons': 'react-native-vector-icons/dist',
    },
    configure: (webpackConfig) => {
      // Add support for React Native modules
      webpackConfig.resolve.extensions.unshift('.web.js', '.web.ts', '.web.tsx');
      
      // Update module rules to include more React Native packages
      const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
      if (oneOfRule) {
        const babelRule = oneOfRule.oneOf.find(rule => 
          rule.test && rule.test.toString().includes('js|mjs|jsx|ts|tsx')
        );
        
        if (babelRule) {
          babelRule.include = [
            ...Array.isArray(babelRule.include) ? babelRule.include : [babelRule.include],
            path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
            path.resolve(__dirname, 'node_modules/react-native-element-dropdown'),
            path.resolve(__dirname, 'node_modules/react-native-reanimated'),
            path.resolve(__dirname, 'node_modules/lottie-react-native'),
            path.resolve(__dirname, 'node_modules/react-native-web'),
            path.resolve(__dirname, 'node_modules/react-native-linear-gradient'),
            path.resolve(__dirname, 'node_modules/react-native-safe-area-context'),
            path.resolve(__dirname, 'node_modules/react-native-screens'),
            path.resolve(__dirname, 'node_modules/react-native-gesture-handler'),
            path.resolve(__dirname, 'node_modules/@react-native-community'),
            path.resolve(__dirname, 'node_modules/@react-navigation'),
          ].filter(Boolean);
        }
      }
      
      // Add fallbacks for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        util: require.resolve('util'),
        assert: require.resolve('assert'),
        url: require.resolve('url'),
        fs: false,
        path: require.resolve('path-browserify'),
      };
      
      // Define global variables
      webpackConfig.plugins.push(
        new (require('webpack').DefinePlugin)({
          __DEV__: process.env.NODE_ENV !== 'production',
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        })
      );
      
      // Add ProvidePlugin for global modules
      webpackConfig.plugins.push(
        new (require('webpack').ProvidePlugin)({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
      
      return webpackConfig;
    },
  },
  jest: {
    configure: {
      preset: 'react-native-web',
      moduleNameMapping: {
        '^react-native$': 'react-native-web',
        '^react-native-linear-gradient$': 'react-native-web-linear-gradient',
      },
    },
  },
};
