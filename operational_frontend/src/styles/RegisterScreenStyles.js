import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e6f0ff',
    // justifyContent: 'space-between', // Ensure content is spaced properly
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#003366',
  },
  inputContainer: {
    marginBottom: 20, // Increased margin to give more space between fields
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    fontSize: 16,
    marginBottom: 5, // Reduced margin to keep the fields close
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 1,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 16,
    color: '#007bff',
    textAlign: 'center',
    marginTop: 20,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButtonText: {
    fontSize: 16,
    color: '#003366',
  },
  selectedCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
    marginLeft: 5,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    marginBottom: 20, // Add bottom margin to prevent overlap with the keyboard
  },

  resendOtpButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FF6347',  // Tomato color or adjust to your style
    borderRadius: 5,
    alignItems: 'center',
  },
  resendOtpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

