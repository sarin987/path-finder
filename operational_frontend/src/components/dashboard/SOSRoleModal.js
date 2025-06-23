import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const roles = [
  { key: 'police', label: 'Police', icon: 'local-police', color: '#1976D2' },
  { key: 'ambulance', label: 'Ambulance', icon: 'local-hospital', color: '#43A047' },
  { key: 'fire', label: 'Fire', icon: 'local-fire-department', color: '#E53935' },
  { key: 'parent', label: 'Parent', icon: 'supervisor-account', color: '#FBC02D' },
];

const SOSRoleModal = ({ visible, onSelect, onCancel, sending, selectedRole }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>Send Emergency Request To:</Text>
        {roles.map(role => (
          <TouchableOpacity
            key={role.key}
            style={[styles.roleBtn, selectedRole === role.key && { backgroundColor: '#f0f0f0' }]}
            onPress={() => onSelect(role.key)}
            disabled={sending}
          >
            <MaterialIcons name={role.icon} size={28} color={role.color} style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 18 }}>{role.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.sosSendBtn} onPress={() => onSelect(selectedRole)} disabled={sending}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{sending ? 'Sending...' : 'Send SOS'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={{ marginTop: 10, alignItems: 'center' }}>
          <Text style={{ color: '#888' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#fff', borderRadius: 18, padding: 24, width: 320, elevation: 10 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 16 },
  roleBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 10 },
  sosSendBtn: { marginTop: 16, backgroundColor: '#E53935', borderRadius: 10, padding: 14, alignItems: 'center' },
});

export default SOSRoleModal;
