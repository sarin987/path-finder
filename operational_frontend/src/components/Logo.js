import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Logo = ({ size = 'medium', animated = false }) => {
  const pulseAnim = new Animated.Value(1);

  React.useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const getSize = () => {
    switch (size) {
      case 'small':
        return { icon: 28, text: 18, shield: 40 };
      case 'large':
        return { icon: 48, text: 32, shield: 64 };
      default:
        return { icon: 36, text: 24, shield: 52 };
    }
  };

  const sizeStyle = getSize();

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <View style={styles.logoContainer}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="shield-check"
            size={sizeStyle.shield}
            color="#3b82f6"
            style={styles.shieldIcon}
          />
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={sizeStyle.icon}
            color="#ffffff"
            style={styles.markerIcon}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.coreText, { fontSize: sizeStyle.text }]}>
            Core
            <Text style={styles.safetyText}>Safety</Text>
          </Text>
          <View style={styles.taglineContainer}>
            <Text style={styles.tagline}>Secure • Navigate • Protect</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  shieldIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  markerIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -9,
    marginTop: -18,
    zIndex: 2,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  coreText: {
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  safetyText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  taglineContainer: {
    marginTop: 2,
  },
  tagline: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  }
});

export default Logo;