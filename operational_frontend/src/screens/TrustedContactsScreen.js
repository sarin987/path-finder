import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import TrustedContacts from '../components/TrustedContacts';
import { useAuth } from '../contexts/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserAvatar from '../components/dashboard/UserAvatar';
import { useNavigation } from '@react-navigation/native';

export default function TrustedContactsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafd' }}>
      {/* Top Bar with user name (copied from UserDashboard) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#128090',
          paddingTop: 18,
          paddingBottom: 12,
          paddingHorizontal: 18,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        {/* Hamburger menu icon to open sidebar */}
        <TouchableOpacity
          onPress={() => navigation.openDrawer && navigation.openDrawer()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 2,
            marginRight: 10,
          }}
        >
          <MaterialIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 18,
              color: '#e0f7fa',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            Trusted Contacts
          </Text>
        </View>
        <UserAvatar
          avatarUrl={user?.avatar}
          onPress={() => navigation.navigate('ChangeProfilePic')}
        />
      </View>
      {/* Trusted Contacts content with top margin to avoid header overlap */}
      <View style={{ flex: 1, marginTop: 70, padding: 16 }}>
        <TrustedContacts userId={user?.id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd', padding: 16 },
});
