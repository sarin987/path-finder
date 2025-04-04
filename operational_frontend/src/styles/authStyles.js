import { StyleSheet, Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale factors based on design width (assuming design was made for iPhone X - 375pt width)
const scale = SCREEN_WIDTH / 375;
const verticalScale = SCREEN_HEIGHT / 812;

// Normalize sizes for different screen densities
const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.03,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center', // Changed from 'flex-start' to 'center'
    paddingHorizontal: normalize(24),
    paddingTop: 0, // Removed paddingTop
    maxWidth: 600, // Maximum width for tablets
    alignSelf: 'center',
    width: '100%',
    marginTop: -SCREEN_HEIGHT * 0.1, // Move content up by 10% of screen height
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: normalize(20), // Reduced margin
    paddingTop: 0, // Removed paddingTop
  },
  lottieContainer: {
    width: Math.min(SCREEN_WIDTH * 0.35, 200), // Cap maximum size
    height: Math.min(SCREEN_WIDTH * 0.35, 200),
    marginBottom: normalize(20),
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: normalize(22),
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: 'gray',
    textAlign: 'center',
    marginBottom: normalize(2),
  },
  subtitle: {
    fontSize: normalize(14),
    color: 'gray',
    textAlign: 'center',
    marginBottom: normalize(12),
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: normalize(16),
    padding: normalize(16),
    elevation: 6,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    width: '100%',
    maxWidth: 500, // Maximum width for tablets
    alignSelf: 'center',
    marginTop: normalize(10), // Added small top margin
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e4e9f2',
    borderRadius: normalize(12),
    marginBottom: normalize(12),
    height: normalize(50),
    paddingHorizontal: normalize(16),
    position: 'relative',
    overflow: 'hidden',
  },
  inputIcon: {
    marginRight: normalize(12),
    color: '#007AFF',
    width: normalize(24),
    height: normalize(24),
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: normalize(24),
  },
  input: {
    flex: 1,
    fontSize: normalize(16),
    color: '#2e3a59',
    height: '100%',
    paddingVertical: 0,
    ...Platform.select({
      ios: {
        paddingTop: 2, // iOS text alignment fix
      },
    }),
  },
  dropdownContainer: {
    marginBottom: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e4e9f2',
    borderRadius: 12,
    height: 50,
    position: 'relative',
  },
  dropdown: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingLeft: 52, // Space for icon (24px icon + 16px left padding + 12px right margin)
    paddingRight: 16,
  },
  dropdownIcon: {
    position: 'absolute',
    left: 16,
    width: 24,
    height: 24,
    alignSelf: 'center',
    color: '#007AFF',
    zIndex: 2,
  },
  dropdownListContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#e4e9f2',
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#8f9bb3', // Changed from 'gray' to proper placeholder color
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#2e3a59', // Changed from 'gray' to dark text
  },
  loginButton: {
    marginTop: normalize(16),
    marginBottom: normalize(12),
    borderRadius: normalize(12),
    overflow: 'hidden',
    backgroundColor: 'primary',
    height: normalize(48),
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  gradientButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: normalize(17),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  switchMethodButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  linkText: {
    color: 'primary',
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16, // Reduced from 24
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'gray',
  },
  dividerText: {
    marginHorizontal: 16,
    color: 'gray',
    fontSize: 15,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285f4',
    borderRadius: 12,
    height: 48, // Reduced from 56
    marginBottom: 12, // Reduced from 16
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  registerButton: {
    alignItems: 'center',
    paddingVertical: 12, // Reduced from 16
  },
  registerText: {
    color: 'primary',
    fontSize: 15,
    fontWeight: '500',
  },
  // Add responsive styles for landscape mode
  '@media (orientation: landscape)': {
    mainContainer: {
      paddingTop: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: -SCREEN_HEIGHT * 0.05, // Less shift up in landscape
    },
    logoContainer: {
      flex: 1,
      marginBottom: 0,
      marginRight: normalize(20),
    },
    formContainer: {
      flex: 2,
    },
  },
});

// Add orientation change handling
Dimensions.addEventListener('change', () => {
  const { width, height } = Dimensions.get('window');
});