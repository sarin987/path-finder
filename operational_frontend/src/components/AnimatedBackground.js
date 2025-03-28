import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { ANIMATION_CONFIG } from '../config/animationConfig';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 999,
  }
});

const FloatingBubble = ({ delay, size, startPosition }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: withRepeat(
        withSequence(
          withTiming(-100, { duration: 2000 }),
          withTiming(0, { duration: 2000 }),
        ),
        -1,
        true
      ),
    }],
    opacity: withRepeat(
      withDelay(
        delay,
        withSequence(
          withTiming(0.7, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 }),
        )
      ),
      -1,
      true
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          left: startPosition,
        },
        animatedStyle,
      ]}
    />
  );
};

export const AnimatedBackground = () => {
  const { bubbles } = ANIMATION_CONFIG;
  
  return (
    <View style={styles.container}>
      {bubbles.sizes.map((size, index) => (
        <FloatingBubble
          key={index}
          delay={bubbles.delays[index]}
          size={size}
          startPosition={bubbles.positions[index]}
        />
      ))}
    </View>
  );
};