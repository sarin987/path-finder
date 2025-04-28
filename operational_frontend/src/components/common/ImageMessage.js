import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';

const ImageMessage = ({ uri, caption }) => (
  <View style={styles.container}>
    <Image source={{ uri }} style={styles.image} />
    {caption ? <Text style={styles.caption}>{caption}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 4,
  },
  caption: {
    color: '#333',
    fontSize: 14,
    marginTop: 2,
  },
});

export default ImageMessage;
