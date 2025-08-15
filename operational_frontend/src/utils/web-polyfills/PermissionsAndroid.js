// Web polyfill for PermissionsAndroid
const PermissionsAndroid = {
  PERMISSIONS: {
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    CAMERA: 'android.permission.CAMERA',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  },

  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },

  check: async (permission) => {
    // For web, we'll simulate permission checking
    if (permission.includes('LOCATION')) {
      // Check if geolocation is available
      return navigator.geolocation ? true : false;
    }

    if (permission.includes('CAMERA')) {
      // Check if mediaDevices is available
      return navigator.mediaDevices ? true : false;
    }

    // Default to granted for web
    return true;
  },

  request: async (permission) => {
    // For web, we'll simulate permission requesting
    if (permission.includes('LOCATION')) {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            () => resolve(PermissionsAndroid.RESULTS.GRANTED),
            () => resolve(PermissionsAndroid.RESULTS.DENIED)
          );
        } else {
          resolve(PermissionsAndroid.RESULTS.DENIED);
        }
      });
    }

    if (permission.includes('CAMERA')) {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        return PermissionsAndroid.RESULTS.DENIED;
      }
    }

    // Default to granted for web
    return PermissionsAndroid.RESULTS.GRANTED;
  },

  requestMultiple: async (permissions) => {
    const results = {};
    for (const permission of permissions) {
      results[permission] = await PermissionsAndroid.request(permission);
    }
    return results;
  },
};

export default PermissionsAndroid;
