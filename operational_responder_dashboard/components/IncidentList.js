import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Modal, Pressable } from 'react-native';
// Use leaflet for web map rendering
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BASE_URL = 'http://localhost:5000'; // Change to your backend's LAN IP if needed for mobile

// Helper to update status in backend
async function updateIncidentStatusBackend(incidentId, newStatus) {
  try {
    const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to update backend');
    return true;
  } catch (err) {
    return false;
  }
}

// Incident map modal
function IncidentMapModal({ visible, onClose, incident }) {
  if (!incident) return null;
  let lat = null, lng = null;
  if (incident.location && incident.location.lat && incident.location.lng) {
    lat = incident.location.lat;
    lng = incident.location.lng;
  } else if (incident.lat && incident.lng) {
    lat = incident.lat;
    lng = incident.lng;
  }
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Incident Location</Text>
          {lat && lng ? (
            <div style={{ width: 280, height: 200, borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
              <MapContainer center={[lat, lng]} zoom={15} style={{ width: '100%', height: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]}>
                  <Popup>
                    Incident Location<br />{lat}, {lng}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <Text style={{ margin: 20 }}>No location data available.</Text>
          )}
          <Pressable style={styles.closeBtn} onPress={onClose}><Text style={styles.closeBtnText}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Modern dashboard card UI for an incident
function IncidentCard({ incident, onAccept, onShowMap }) {
  // Format time (e.g., '1 min ago')
  let timeAgo = '';
  const created = new Date(incident.createdAt || incident.timestamp || Date.now());
  const now = new Date();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) timeAgo = 'just now';
  else if (diffMin === 1) timeAgo = '1 min ago';
  else if (diffMin < 60) timeAgo = `${diffMin} min ago`;
  else timeAgo = created.toLocaleString();

  // Location string
  let location = 'Unknown location';
  if (incident.location && incident.location.lat && incident.location.lng) {
    location = `${incident.location.lat}, ${incident.location.lng}`;
  } else if (incident.lat && incident.lng) {
    location = `${incident.lat}, ${incident.lng}`;
  } else if (incident.locationName) {
    location = incident.locationName;
  }

  // User info
  let userName = incident.userName || incident.user || (incident.User && incident.User.name) || 'Unknown';
  let userRole = incident.role || (incident.User && incident.User.role) || 'User';
  if (typeof userName === 'object' && userName !== null) userName = userName.name || 'Unknown';
  if (typeof userRole === 'object' && userRole !== null) userRole = userRole.role || 'User';

  // Status
  const status = incident.status || 'pending';

  return (
    <View style={styles.cardModern}>
      <Pressable onPress={() => onShowMap(incident)} style={{ flex: 1 }}>
        <View style={styles.cardModernRow}>
          <View style={styles.sosModern}><Text style={styles.sosModernText}>SOS</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardModernTitle}>SOS Alert <Text style={styles.cardModernTime}>{timeAgo}</Text></Text>
            <Text style={styles.cardModernLocation}>{location}</Text>
          </View>
          <TouchableOpacity
            style={[styles.acceptModernBtn, status === 'accepted' && styles.acceptedModernBtn]}
            onPress={() => onAccept(incident)}
            disabled={status === 'accepted'}
          >
            <Text style={styles.acceptModernBtnText}>{status === 'accepted' ? 'Accepted' : 'ACCEPT'}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
      <View style={styles.cardModernActions}>
        <TouchableOpacity style={styles.iconModern}><Text>📷</Text></TouchableOpacity>
        <TouchableOpacity style={styles.iconModern}><Text>🔊</Text></TouchableOpacity>
        <TouchableOpacity style={styles.iconModern}><Text>🎤</Text></TouchableOpacity>
        <Text style={styles.cardModernUser}>{userName} <Text style={{ fontWeight: 'bold' }}>{userRole}</Text></Text>
      </View>
    </View>
  );
}

const IncidentList = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    async function fetchIncidents() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BASE_URL}/api/incidents`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch incidents');
        const data = await response.json();
        // Debug output
        console.log('[IncidentList] incidents from backend:', data);
        // Only show non-resolved incidents
        setIncidents(Array.isArray(data) ? data.filter(i => i.status !== 'resolved') : []);
      } catch (err) {
        setError('Failed to load incidents');
      } finally {
        setLoading(false);
      }
    }
    fetchIncidents();
  }, []);

  const handleAccept = async (incident) => {
    try {
      setLoading(true);
      await updateIncidentStatusBackend(incident.id, 'accepted');
      // Refresh incidents after update
      const response = await fetch(`${BASE_URL}/api/incidents`, { credentials: 'include' });
      const data = await response.json();
      setIncidents(Array.isArray(data) ? data.filter(i => i.status !== 'resolved') : []);
      setLoading(false);
      Alert.alert('Incident accepted');
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to accept incident');
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Text style={styles.headerText}>
        Incident Overview
      </Text>
      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ color: 'red', margin: 20 }}>{error}</Text>
        ) : !incidents.length ? (
          <Text style={{ margin: 20 }}>No active incidents.</Text>
        ) : (
          <FlatList
            data={incidents}
            keyExtractor={item => item.id?.toString() || item._id?.toString()}
            renderItem={({ item }) => (
              <IncidentCard incident={item} onAccept={handleAccept} onShowMap={inc => { setSelectedIncident(inc); setShowMap(true); }} />
            )}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        )}
      </View>
      <IncidentMapModal visible={showMap} onClose={() => setShowMap(false)} incident={selectedIncident} />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f3f6fa',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
    minHeight: '100%',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#222',
  },
  listContainer: {
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  cardModern: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 0,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
    maxWidth: 700,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e6eaf0',
    flexDirection: 'column',
  },
  cardModernRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sosModern: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sosModernText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardModernTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  cardModernTime: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'normal',
  },
  cardModernLocation: {
    fontSize: 16,
    color: '#444',
    marginTop: 2,
  },
  acceptModernBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginLeft: 16,
  },
  acceptedModernBtn: {
    backgroundColor: '#888',
  },
  acceptModernBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardModernActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  iconModern: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f6fa',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardModernUser: {
    marginLeft: 16,
    fontSize: 16,
    color: '#444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 340,
    alignItems: 'center',
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  closeBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default IncidentList;
