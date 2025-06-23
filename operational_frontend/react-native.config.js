module.exports = {
  dependencies: {
    'react-native-svg': {
      platforms: {
        android: null, // disable Android platform, other platforms will still autolink if provided
      },
    },
  },
  project: {
    android: {
      sourceDir: './android',
    },
  },
  assets: ['./assets/fonts/'],
};
