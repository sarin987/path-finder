import React, { useEffect, useState } from 'react';
import { FaAmbulance, FaUserInjured, FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Sidebar from '../common/Sidebar';
import EmergencyCalls from './AmbulanceDashboard/EmergencyCalls';
import Chat from '../common/Chat';
import MapComponent from '../common/MapComponent';
import socket, { socketHelpers } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const AmbulanceDashboard = () => {
  // Example state for patients
  const [patients, setPatients] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // TODO: Fetch patients from backend
    setPatients([
      { id: 1, name: 'John Doe', status: 'Critical', location: '123 Main St' },
      { id: 2, name: 'Jane Smith', status: 'Stable', location: '456 Elm St' }
    ]);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          // Send ambulance location to server for user tracking
          socketHelpers.sendLocationUpdate({
            userId: user?.id,
            role: 'ambulance',
            location: loc
          });
        },
        () => setUserLocation(null)
      );
    }
  }, [user]);

  useEffect(() => {
    let watchId;
    if (navigator.geolocation && user) {
      const sendLoc = (pos) => {
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation({ lat: loc.latitude, lng: loc.longitude });
        // Emit location to backend for real-time responder tracking
        socket.emit('responder_location_update', {
          id: user.id,
          role: 'ambulance',
          name: user.name,
          contact: user.contact || user.phone || '',
          location: loc
        });
      };
      // Initial send
      navigator.geolocation.getCurrentPosition(sendLoc);
      // Watch position for live updates
      watchId = navigator.geolocation.watchPosition(sendLoc);
    }
    return () => {
      if (navigator.geolocation && watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user]);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar role="ambulance" />
      <div style={{ flex: 1 }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Ambulance Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                <FaBell className="text-gray-600" />
              </button>
              <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                <FaAmbulance className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Emergency Calls & Patients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div className="bg-white rounded-lg shadow p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Calls</h2>
              <EmergencyCalls />
            </motion.div>
            <motion.div className="bg-white rounded-lg shadow p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Patients</h2>
              <ul>
                {patients.length === 0 ? <li>No patients found.</li> : patients.map((p) => (
                  <li key={p.id} className="mb-2">
                    <span className="font-bold">{p.name}</span> - {p.status} @ {p.location}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Live Map */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Live Map</h2>
              <p className="text-sm text-gray-500">Real-time ambulance and patient locations</p>
            </div>
            <div className="relative h-[300px]">
              <MapComponent userLocation={userLocation} showLiveTracking={true} />
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat</h2>
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceDashboard;