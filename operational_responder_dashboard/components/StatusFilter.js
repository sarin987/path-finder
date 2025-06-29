import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

export default function StatusFilter({ status, setStatus }) {
  return (
    <View style={styles.filters}>
      {['pending','accepted','resolved'].map(s => (
        <Button key={s} title={s} onPress={() => setStatus(s)} color={status === s ? 'blue' : 'gray'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
});
