const path = require('path');
const webpack = require('webpack');

module.exports = {
  // your existing webpack config...

  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-linear-gradient$': 'react-native-web-linear-gradient',
    },
    extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx'],
  },

  module: {
    rules: [
      {
        test: /\\.(js|jsx|ts|tsx)$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
          path.resolve(__dirname, 'node_modules/react-native-element-dropdown'),
          path.resolve(__dirname, 'node_modules/react-native-reanimated'),
          path.resolve(__dirname, 'node_modules/lottie-react-native'),
          // Add other necessary modules here
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
      // other loaders...
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      __DEV__: process.env.NODE_ENV !== 'production',
    }),
    // other plugins...
  ],

  // To fix 'react-native-reanimated' issue with web
  externals: {
    'react-native-reanimated': 'require(\"react-native-reanimated\")',
  },
};
