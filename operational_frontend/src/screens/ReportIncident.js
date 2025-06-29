import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import IncidentReportForm from '../components/IncidentReportForm';
import ResponderMap from '../components/ResponderMap';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import UserAvatar from '../components/dashboard/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const RECIPIENTS = [
  { key: 'police', label: 'Police', icon: 'police-badge', color: '#1976D2' },
  { key: 'fire', label: 'Fire Brigade', icon: 'fire', color: '#E53935' },
  { key: 'ambulance', label: 'Ambulance', icon: 'ambulance', color: '#43A047' },
  { key: 'custom', label: 'Select on Map', icon: 'map-marker', color: '#FBC02D' },
];

const ReportIncident = (props) => {
  const { navigation } = props;
  const { user } = useAuth();
  const nav = useNavigation();
  const [recipient, setRecipient] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedResponder, setSelectedResponder] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRecipientSelect = (key) => {
    if (key === 'custom') {
      setShowMap(true);
    } else {
      setRecipient(key);
    }
  };

  const handleResponderSelect = (responder) => {
    setSelectedResponder(responder);
    setRecipient(responder.role);
    setShowMap(false);
  };

  const handleReportSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Consistent header with hamburger and avatar */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#128090', paddingTop: 18, paddingBottom: 12, paddingHorizontal: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
        <TouchableOpacity onPress={() => nav.openDrawer && nav.openDrawer()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 2, marginRight: 10 }}>
          <MaterialIcons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#e0f7fa', fontWeight: 'bold', textAlign: 'center' }}>Report Incident</Text>
        </View>
        <UserAvatar avatarUrl={user?.avatar} onPress={() => nav.navigate('ChangeProfilePic')} />
      </View>
      {/* Content with top margin to avoid header overlap */}
      <View style={{ flex: 1, marginTop: 70 }}>
        {!recipient && (
          <View style={styles.recipientContainer}>
            <Text style={styles.label}>Who do you want to notify?</Text>
            <View style={styles.recipientList}>
              {RECIPIENTS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.recipientButton, { backgroundColor: r.color, shadowColor: r.color, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 }]}
                  onPress={() => handleRecipientSelect(r.key)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name={r.icon} size={32} color="#fff" />
                  <Text style={styles.recipientLabel}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {showMap && (
          <Modal visible={showMap} animationType="slide">
            <ResponderMap onSelectResponder={handleResponderSelect} onClose={() => setShowMap(false)} />
          </Modal>
        )}
        {recipient && !showMap && (
          <View style={styles.formContainer}>
            <IncidentReportForm
              recipient={recipient}
              responder={selectedResponder}
              onReportSuccess={handleReportSuccess}
              onCancel={() => setRecipient(null)}
            />
          </View>
        )}
        {success && (
          <View style={styles.successOverlay}>
            <MaterialCommunityIcons name="check-circle" size={72} color="#43A047" />
            <Text style={styles.successText}>Incident Reported!</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', letterSpacing: 0.2 },
  recipientContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  label: { fontSize: 19, fontWeight: '600', marginBottom: 18, color: '#1e293b' },
  recipientList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  recipientButton: { flexDirection: 'column', alignItems: 'center', margin: 12, padding: 22, borderRadius: 16, minWidth: 110, minHeight: 110, justifyContent: 'center' },
  recipientLabel: { color: '#fff', fontWeight: 'bold', marginTop: 10, fontSize: 16, letterSpacing: 0.1, textAlign: 'center' },
  formContainer: { flex: 1, justifyContent: 'center', padding: 12 },
  successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.97)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  successText: { fontSize: 24, color: '#43A047', fontWeight: 'bold', marginTop: 16 },
});

export default ReportIncident;
