import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Sidebar = ({ 
  user, 
  role, 
  sidebarAnimation, 
  toggleSidebar, 
  navigation, 
  logout 
}) => {
  return (
    <Animated.View 
      style={[
        styles.sidebar,
        {
          transform: [{ translateX: sidebarAnimation }]
        }
      ]}
    >
      <View style={styles.userInfo}>
        <MaterialCommunityIcons name="account-circle" size={60} color="#007AFF" />
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userRole}>{role}</Text>
      </View>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          toggleSidebar();
          navigation.navigate('Profile');
        }}
      >
        <MaterialCommunityIcons name="account" size={24} color="#333" />
        <Text style={styles.menuText}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={logout}
      >
        <MaterialCommunityIcons name="logout" size={24} color="#333" />
        <Text style={styles.menuText}>Logout</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: 'white',
    padding: 20,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
});

export default Sidebar;
