# useResponderLocations Hook

A custom React hook for managing and tracking responder locations in real-time using WebSockets. This hook provides a simple interface to fetch, filter, and sort responder locations based on various criteria.

## Features

- Real-time location updates via WebSocket
- Filter responders by role and distance
- Sort responders by proximity to a reference point
- Automatic reconnection on connection loss
- Caching and error handling
- TypeScript support

## Installation

1. Make sure you have the required dependencies installed:
   ```bash
   npm install @react-native-async-storage/async-storage axios socket.io-client
   ```

2. Import the hook in your component:
   ```javascript
   import useResponderLocations from './useResponderLocations';
   ```

## Usage

### Basic Usage

```javascript
const {
  responders,
  loading,
  error,
  refetch,
  socketConnected
} = useResponderLocations({
  center: { latitude: 37.7749, longitude: -122.4194 }, // Reference point
  radius: 10, // km
  roles: ['police', 'ambulance'], // Filter by role
  sortByProximity: true,
  maxDistance: 50 // Max distance in km
});
```

### With Map Integration

```javascript
import MapView, { Marker } from 'react-native-maps';

function ResponderMap() {
  const { responders, loading } = useResponderLocations({
    center: userLocation,
    radius: 15,
  });

  if (loading) return <ActivityIndicator />;

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {responders.map((responder) => (
        <Marker
          key={responder.userId}
          coordinate={{
            latitude: responder.latitude,
            longitude: responder.longitude,
          }}
          title={`${responder.role} - ${responder.distanceFormatted} away`}
        />
      ))}
    </MapView>
  );
}
```

## API Reference

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `center` | `{ latitude: number, longitude: number }` | `undefined` | Reference point for distance calculations |
| `radius` | `number` | `10` | Filter radius in kilometers |
| `enabled` | `boolean` | `true` | Enable/disable the hook |
| `roles` | `string[]` | `['police', 'ambulance', 'fire']` | Filter responders by role |
| `sortByProximity` | `boolean` | `true` | Sort responders by distance from center |
| `filterByRole` | `boolean` | `true` | Enable/disable role filtering |
| `maxDistance` | `number` | `50` | Maximum distance in kilometers to include responders |

### Return Value

The hook returns an object with the following properties:

#### Data
- `responders`: Array of responder objects with location data
- `loading`: Boolean indicating if data is being fetched
- `error`: Error message if any error occurred
- `lastUpdated`: Timestamp of the last update
- `socketConnected`: Boolean indicating WebSocket connection status
- `responderCounts`: Object with counts of responders by role
- `availableRoles`: Array of unique role names in the current dataset

#### Helpers
- `getResponderById(id)`: Get a responder by ID
- `getRespondersByRole(role)`: Get all responders with a specific role
- `getClosestResponder()`: Get the closest responder to the center
- `refetch()`: Manually refresh the data

#### Status
- `hasResponders`: Boolean indicating if there are any responders
- `totalResponders`: Total number of responders

## Error Handling

The hook handles various error scenarios:
- Network errors during initial fetch
- WebSocket connection issues
- Authentication failures
- Invalid data formats

## Performance Considerations

- The hook uses memoization to prevent unnecessary re-renders
- WebSocket connections are managed efficiently
- Distance calculations are optimized
- Data is cached when possible

## License

MIT
