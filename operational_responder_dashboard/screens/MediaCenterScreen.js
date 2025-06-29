import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, ActivityIndicator } from 'react-native';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

// Helper to determine file type
const getFileType = (name) => {
  if (name.match(/\.(jpg|jpeg|png|gif)$/i)) return 'image';
  if (name.match(/\.(mp4|mov|webm)$/i)) return 'video';
  if (name.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
  return 'other';
};

export default function MediaCenterScreen() {
  const { logout, user } = useAuth();
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');
  const isMobile = width < 600;
  const SIDEBAR_WIDTH = 80;
  const sidebarItems = [
    { label: 'Dashboard', icon: 'Dashboard', screen: 'dashboard' },
    { label: 'Incident', icon: 'ReportProblem', screen: 'incident' },
    { label: 'Live Map', icon: 'Map', screen: 'map' },
    { label: 'Chat', icon: 'Chat', screen: 'chat' },
    { label: 'Media', icon: 'PhotoCamera', screen: 'media' },
    { label: 'History', icon: 'Assessment', screen: 'history' },
    { label: 'Settings', icon: 'Settings', screen: 'settings' },
  ];
  const activeScreen = 'media';

  // Media fetching state
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your logic to get assigned incident IDs for the user
    const assignedIncidentIds = user?.assignedIncidents || [];
    if (!assignedIncidentIds.length) {
      setLoading(false);
      return;
    }
    const storage = getStorage();
    const fetchMedia = async () => {
      let allMedia = [];
      for (const incidentId of assignedIncidentIds) {
        const folderRef = ref(storage, `incidents/${incidentId}/media`);
        try {
          const res = await listAll(folderRef);
          for (const itemRef of res.items) {
            const url = await getDownloadURL(itemRef);
            allMedia.push({
              name: itemRef.name,
              url,
              type: getFileType(itemRef.name),
              incidentId,
            });
          }
        } catch (e) {
          // Ignore missing folders
        }
      }
      setMedia(allMedia);
      setLoading(false);
    };
    fetchMedia();
  }, [user]);

  const renderMedia = ({ item }) => {
    if (item.type === 'image') {
      return (
        <View style={styles.mediaItem}>
          <Image source={{ uri: item.url }} style={styles.image} />
          <Text style={styles.caption}>{item.name}</Text>
        </View>
      );
    }
    if (item.type === 'video') {
      return (
        <View style={styles.mediaItem}>
          <Text style={styles.caption}>Video: {item.name}</Text>
        </View>
      );
    }
    if (item.type === 'audio') {
      return (
        <View style={styles.mediaItem}>
          <Text style={styles.caption}>Audio: {item.name}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Sidebar
        items={sidebarItems}
        onNavigate={screen => {
          switch (screen) {
            case 'dashboard':
              navigation.navigate('Dashboard');
              break;
            case 'incident':
              navigation.navigate('Incident');
              break;
            case 'map':
              navigation.navigate('Map');
              break;
            case 'chat':
              navigation.navigate('Chat');
              break;
            case 'media':
              navigation.navigate('MediaCenter');
              break;
            case 'history':
              navigation.navigate('History');
              break;
            case 'settings':
              navigation.navigate('Settings');
              break;
            default:
              navigation.navigate(screen.charAt(0).toUpperCase() + screen.slice(1));
          }
        }}
        isMobile={isMobile}
        sidebarWidth={SIDEBAR_WIDTH}
        onLogout={logout}
        activeScreen={activeScreen}
      />
      <View style={styles.main}>
        <Text style={styles.title}>Media Center</Text>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : !media.length ? (
          <Text style={styles.empty}>No media found for your assigned incidents.</Text>
        ) : (
          <FlatList
            data={media}
            keyExtractor={item => item.url}
            renderItem={renderMedia}
            numColumns={2}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const isMobile = width < 600;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    backgroundColor: '#f5f7fa',
  },
  main: {
    flex: 1,
    padding: isMobile ? 16 : 40,
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  title: { fontSize: 20, fontWeight: 'bold', margin: 16 },
  list: { gap: 16 },
  mediaItem: { flex: 1, margin: 8, alignItems: 'center' },
  image: { width: 150, height: 150, borderRadius: 8, backgroundColor: '#eee' },
  caption: { marginTop: 8, fontSize: 14, textAlign: 'center' },
  empty: { flex: 1, textAlign: 'center', marginTop: 40, color: '#888' },
});
