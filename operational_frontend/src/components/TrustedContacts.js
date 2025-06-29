import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ToastAndroid, Platform } from 'react-native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TrustedContacts = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchContacts = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/contacts/list/${userId}`);
      setContacts(res.data);
    } catch (e) {
      ToastAndroid.show('Failed to load contacts', ToastAndroid.LONG);
    }
    setFetching(false);
  };

  useEffect(() => { fetchContacts(); }, []);

  const addContact = async () => {
    if (!contactName.trim() || !/^\+?\d{7,15}$/.test(contactPhone)) {
      ToastAndroid.show('Enter a valid name and phone number', ToastAndroid.SHORT);
      return;
    }
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/contacts/add', {
        user_id: userId,
        contact_name: contactName,
        contact_phone: contactPhone,
      });
      setContactName(''); setContactPhone('');
      ToastAndroid.show('Contact added!', ToastAndroid.SHORT);
      fetchContacts();
    } catch (e) {
      ToastAndroid.show('Failed to add contact', ToastAndroid.LONG);
    }
    setLoading(false);
  };

  const confirmDelete = (id) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this contact?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteContact(id) },
    ]);
  };

  const deleteContact = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/contacts/delete/${id}`);
      ToastAndroid.show('Contact removed', ToastAndroid.SHORT);
      fetchContacts();
    } catch (e) {
      ToastAndroid.show('Failed to remove contact', ToastAndroid.LONG);
    }
    setLoading(false);
  };

  const sendTestAlert = async () => {
    setSendingAlert(true);
    try {
      await axios.post('http://localhost:5000/api/contacts/alert', {
        user_id: userId,
        alert_message: 'This is a test alert from Core Safety.',
        location: null,
      });
      ToastAndroid.show('Test alert sent to all contacts!', ToastAndroid.SHORT);
    } catch (e) {
      ToastAndroid.show('Failed to send alert', ToastAndroid.LONG);
    }
    setSendingAlert(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Trusted Contacts</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Contact Name"
          value={contactName}
          onChangeText={setContactName}
          style={styles.input}
        />
        <TextInput
          placeholder="Contact Phone"
          value={contactPhone}
          onChangeText={setContactPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addContact} disabled={loading}>
          <MaterialIcons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.alertBtn} onPress={sendTestAlert} disabled={sendingAlert || !contacts.length}>
        <MaterialIcons name="notifications-active" size={22} color="#fff" />
        <Text style={{ color: '#fff', marginLeft: 8, fontWeight: 'bold' }}>{sendingAlert ? 'Sending...' : 'Send Test Alert'}</Text>
      </TouchableOpacity>
      {fetching ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#1976D2" />
      ) : !contacts.length ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="group" size={48} color="#cbd5e1" />
          <Text style={{ color: '#888', marginTop: 8 }}>No trusted contacts yet.</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.contactCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{item.contact_name}</Text>
                <Text style={styles.contactPhone}>{item.contact_phone}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn}>
                <MaterialIcons name="delete" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  header: { fontWeight: 'bold', fontSize: 20, marginBottom: 12, color: '#1976D2', alignSelf: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, marginHorizontal: 4, backgroundColor: '#fff' },
  addBtn: { backgroundColor: '#1976D2', padding: 10, borderRadius: 6, marginLeft: 4 },
  alertBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1d4ed8', padding: 12, borderRadius: 8, marginTop: 8, alignSelf: 'center', paddingHorizontal: 24 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 14, marginVertical: 6, elevation: 1 },
  contactName: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  contactPhone: { color: '#555', fontSize: 14, marginTop: 2 },
  deleteBtn: { backgroundColor: '#dc2626', padding: 8, borderRadius: 6, marginLeft: 10 },
  emptyState: { alignItems: 'center', marginTop: 40 },
});

export default TrustedContacts;
