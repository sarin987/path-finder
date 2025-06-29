import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserAvatar from '../components/dashboard/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
// import MapView, { Polyline } from 'react-native-maps'; // Uncomment if using react-native-maps
// import { getSafeRoute } from '../services/routeService'; // Placeholder for backend call

export default function SafeRouteScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [destination, setDestination] = useState('');
  // const [route, setRoute] = useState([]); // For route polyline

  const handleFindRoute = () => {
    // TODO: Call backend to get safe route
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafd' }}>
      {/* Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#128090', paddingTop: 18, paddingBottom: 12, paddingHorizontal: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
        <TouchableOpacity onPress={() => navigation.openDrawer && navigation.openDrawer()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 2, marginRight: 10 }}>
          <MaterialIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#e0f7fa', fontWeight: 'bold', textAlign: 'center' }}>Safe Route</Text>
        </View>
        <UserAvatar avatarUrl={user?.avatar} onPress={() => navigation.navigate('ChangeProfilePic')} />
      </View>
      {/* Content with top margin */}
      <View style={{ flex: 1, marginTop: 70 }}>
        <Text style={styles.header}>Safe Route</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter destination address"
          value={destination}
          onChangeText={setDestination}
        />
        <Button title="Find Safe Route" onPress={handleFindRoute} />
        {/* TODO: Show MapView with route and heatmap */}
        {/* TODO: Add live tracking and off-route alert features */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafd', padding: 16 },
  header: { fontWeight: 'bold', fontSize: 20, marginBottom: 12, color: '#1976D2', alignSelf: 'center' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, marginBottom: 12, backgroundColor: '#fff' },
});
