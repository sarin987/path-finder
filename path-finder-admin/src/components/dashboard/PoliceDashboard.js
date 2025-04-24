import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmergencyCalls from './PoliceDashboard/EmergencyCalls';
import ActiveCases from './PoliceDashboard/ActiveCases';
import Chat from './PoliceDashboard/Chat';
import Map from './PoliceDashboard/Map';

const PoliceDashboard = () => {
  const [emergencyCalls, setEmergencyCalls] = useState([]);
  const [activeCases, setActiveCases] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);

  const fetchEmergencyCalls = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/emergency-calls');
      setEmergencyCalls(response.data);
    } catch (error) {
      console.error('Error fetching emergency calls:', error);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat-messages');
      setChatMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const fetchSharedLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/shared-locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching shared locations:', error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/active-users');
      setActiveUsers(response.data);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  useEffect(() => {
    fetchEmergencyCalls();
    fetchChatMessages();
    fetchSharedLocations();
    fetchActiveUsers();
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Police Dashboard</h1>
        {/* Notifications and Profile */}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <EmergencyCalls calls={emergencyCalls} />
        <ActiveCases cases={activeCases} />
        <Chat messages={chatMessages} />
        <Map locations={locations} activeUsers={activeUsers} />
      </div>
    </div>
  );
};

export default PoliceDashboard;