import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const EmergencyMenuOption = ({ label, color, icon, onPress }) => {
  return (
    <TouchableOpacity style={[styles.option, { backgroundColor: color }]} onPress={onPress}>
      {/* Icon can be added here if needed */}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

EmergencyMenuOption.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  option: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  label: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default EmergencyMenuOption;