import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const TrustedContacts = ({ userId }) => {
  const [contacts, setContacts] = useState([]);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/contacts/list/${userId}`);
      setContacts(res.data);
    } catch (e) {
      alert('Failed to load contacts');
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const addContact = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/contacts/add', {
        user_id: userId,
        contact_name: contactName,
        contact_phone: contactPhone,
      });
      setContactName(''); setContactPhone('');
      fetchContacts();
    } catch (e) {
      alert('Failed to add contact');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Trusted Contacts</Text>
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
      <Button title={loading ? 'Adding...' : 'Add Contact'} onPress={addContact} disabled={loading} />
      <FlatList
        data={contacts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <Text>{item.contact_name} ({item.contact_phone})</Text>
          </View>
        )}
        style={{ marginTop: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginVertical: 4 },
  contactItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
});

export default TrustedContacts;
