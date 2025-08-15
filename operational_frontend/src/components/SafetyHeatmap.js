import React from 'react';
import { StyleSheet } from 'react-native';
import { Heatmap } from 'react-native-maps';

export const SafetyHeatmap = ({ safetyData }) => {
  return (
    <Heatmap
      points={safetyData}
      radius={50}
      opacity={0.7}
      gradient={{
        colors: ['#00FF00', '#FFFF00', '#FF0000'],
        startPoints: [0.2, 0.5, 0.8],
      }}
    />
  );
};
