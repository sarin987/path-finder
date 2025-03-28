import { StyleSheet, Dimensions, Platform } from 'react-native';
const { width, height } = Dimensions.get('window');

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
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: height * 0.02, // Reduced from 0.05 to move content up
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12, // Reduced from 16
  },
  lottieContainer: {
    width: width * 0.28, // Reduced from 0.18
    height: width * 0.28, // Reduced from 0.18
    marginBottom: 0.5, // Reduced from 8
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 22, // Reduced from 24
    fontWeight: '700',
    color: 'gray',
    textAlign: 'center',
    marginBottom: 2, // Reduced from 4
  },
  subtitle: {
    fontSize: 14, // Reduced from 15
    color: 'gray',
    textAlign: 'center',
    marginBottom: 12, // Reduced from 16
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16, // Reduced from 20
    elevation: 6,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Changed from 'gray' to white
    borderWidth: 1.5,
    borderColor: '#e4e9f2', // Changed from 'gray' to light border
    borderRadius: 12,
    marginBottom: 12, // Reduced from 16
    height: 50, // Reduced from 56
    paddingHorizontal: 16,
    // Add these properties to ensure icon alignment
    position: 'relative',
    overflow: 'hidden',
  },
  inputIcon: {
    marginRight: 12,
    color: '#007AFF', // Use direct color instead of 'primary'
    width: 24, // Add fixed width
    height: 24, // Add fixed height
    alignSelf: 'center', // Center vertically
    textAlign: 'center', // Center horizontally
    lineHeight: 24, // Match height for vertical centering
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2e3a59', // Changed from 'gray' to dark text
    height: '100%', // Fill container height
    paddingVertical: 0, // Remove vertical padding
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
    marginTop: 16, // Reduced from 24
    marginBottom: 12, // Reduced from 16
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'primary',
    height: 48, // Reduced from 56
  },
  gradientButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  switchMethodButton: {
    alignItems: 'center',
    paddingVertical: 16,
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
});