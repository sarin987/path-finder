import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ResponderBottomSheet = ({ responders, onChat, onCall, onClose, visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Responders</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={28} color="#888" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={responders}
        keyExtractor={item => item.id?.toString() || item.role}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MaterialIcons name={item.icon} size={32} color={item.color} />
            <View style={{ marginLeft: 14 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name || item.role}</Text>
              <Text style={{ color: '#888' }}>{item.role}</Text>
            </View>
            <TouchableOpacity style={styles.chatBtn} onPress={() => onChat(item)}>
              <MaterialIcons name="chat" size={22} color="#1976D2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn} onPress={() => onCall(item)}>
              <MaterialIcons name="call" size={22} color="#43A047" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No responders nearby.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 340, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 16, zIndex: 20, paddingBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontWeight: 'bold', fontSize: 18 },
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderColor: '#eee' },
  chatBtn: { marginLeft: 'auto', marginRight: 10 },
  callBtn: {},
});

export default ResponderBottomSheet;
