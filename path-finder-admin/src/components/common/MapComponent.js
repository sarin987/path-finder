// src/components/common/MapComponent.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useAuth } from '../../context/AuthContext';

const MapComponent = ({ userLocation, showLiveTracking, isParent }) => {
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const { user } = useAuth();

  const containerStyle = {
    width: '100%',
    height: '500px'
  };

  const center = {
    lat: userLocation?.lat || 12.9716,
    lng: userLocation?.lng || 77.5946
  };

  useEffect(() => {
    if (map && showLiveTracking) {
      map.setCenter(center);
    }
  }, [map, showLiveTracking, center]);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  const renderMarkers = () => {
    if (!userLocation) return null;

    return (
      <Marker
        position={center}
        onClick={() => handleMarkerClick(center)}
        label={user?.name?.charAt(0)}
      />
    );
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        libraries={['places']}
        onLoad={() => setLoading(false)}
        onUnmount={() => setLoading(true)}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={map => setMap(map)}
          onClick={() => setSelectedMarker(null)}
        >
          {renderMarkers()}
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div>
                <h3>{user?.name}</h3>
                <p>Role: {user?.role}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      {loading && <div className="loading">Loading map...</div>}
    </div>
  );
};

export default MapComponent;