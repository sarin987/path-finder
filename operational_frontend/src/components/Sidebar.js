import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const Sidebar = (props) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Component mounted, starting user data fetch');
    const fetchUserData = async () => {
      console.log('Fetching user data...');
      const currentUser = auth().currentUser;
      console.log('Current user:', currentUser ? currentUser.uid : 'No user logged in');
      if (currentUser) {
        try {
          console.log('Fetching user document for UID:', currentUser.uid);
          const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
          if (userDoc.exists) {
            console.log('User data found:', userDoc.data());
            console.log('Setting user state with:', userDoc.data());
            setUser(userDoc.data());
          } else {
            console.log('User document does not exist, setting default user data');
            setUser({ name: 'Unknown User', profilePhoto: '' });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          console.log('Setting default user data due to error');
          setUser({ name: 'Unknown User', profilePhoto: '' });
        }
      } else {
        console.log('No authenticated user, setting default user data');
        setUser({ name: 'Unknown User', profilePhoto: '' });
      }
      console.log('User data fetch complete');
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={{ alignItems: 'center', padding: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <>
              <Image
                source={{
                  uri: user?.profilePhoto || 'https://www.flaticon.com/free-icons/user-profiles',
                }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
              <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
                {user?.name || 'User'}
              </Text>
            </>
          )}
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity onPress={handleLogout} style={{ padding: 20 }}>
        <Text style={{ color: 'red' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Sidebar;
