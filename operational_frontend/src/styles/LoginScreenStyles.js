import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100vh',
    padding: 30,
    backgroundColor: '#e6f0ff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#003366',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 10, // Added marginBottom for spacing
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    fontSize: 16,
    marginBottom: 20, // Added marginBottom for spacing
  },
  signInButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20, // Added marginBottom for spacing
  },
  signInText: {
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

  form: {
    borderWidth: 1,
    borderColor: '#cccccc', // Border for the form
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#fff', // To make it stand out
    shadowColor: '#000', // Shadow color
    shadowOffset: { width: 0, height: 4 }, // Shadow offset
    shadowOpacity: 0.1, // Transparent shadow
    shadowRadius: 6, // Shadow spread radius
    elevation: 5, // For Android devices
  },

  dropdown: {
    width: '100%',
    height: 50,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20, // Space between dropdown and other fields
    shadowColor: '#000', // Shadow color for the dropdown
    shadowOffset: { width: 0, height: 4 }, // Shadow offset for the dropdown
    shadowOpacity: 0.1, // Transparent shadow for the dropdown
    shadowRadius: 6, // Shadow spread radius for the dropdown
    elevation: 5, // For Android devices (dropdown shadow)
  },
});
