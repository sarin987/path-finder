import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

const LoadingState = () => (
  <SkeletonPlaceholder>
    <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
      {/* Add skeleton layout matching your UI */}
    </SkeletonPlaceholder.Item>
  </SkeletonPlaceholder>
);
