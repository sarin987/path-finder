import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const ANIMATION_CONFIG = {
  bubbles: {
    sizes: [60, 45, 75],
    positions: [width * 0.2, width * 0.8, width * 0.5],
    delays: [0, 1000, 2000]
  }
};