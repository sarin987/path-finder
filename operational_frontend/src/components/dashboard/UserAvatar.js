import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const UserAvatar = ({ avatarUrl, onPress }) => {
  const navigation = useNavigation();
  const handlePress = onPress || (() => navigation.navigate('ChangeProfilePic'));
  return (
    <TouchableOpacity onPress={handlePress} style={{ width: 38, height: 38, borderRadius: 19, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: 38, height: 38, borderRadius: 19 }} />
      ) : (
        <MaterialIcons name="person" size={26} color="#888" />
      )}
    </TouchableOpacity>
  );
};

export default UserAvatar;
