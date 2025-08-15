import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useOrientation = () => {
  const [orientation, setOrientation] = useState('PORTRAIT');

  useEffect(() => {
    const onChange = ({ window: { width, height } }) => {
      setOrientation(width < height ? 'PORTRAIT' : 'LANDSCAPE');
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return orientation;
};
