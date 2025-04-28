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
      const response = await axios.get('http://192.168.1.4:5000/api/emergency-calls');
      setEmergencyCalls(response.data);
    } catch (error) {
      console.error('Error fetching emergency calls:', error);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await axios.get('http://192.168.1.4:5000/api/chat-messages');
      setChatMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const fetchSharedLocations = async () => {
    try {
      const response = await axios.get('http://192.168.1.4:5000/api/shared-locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching shared locations:', error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const response = await axios.get('http://192.168.1.4:5000/api/active-users');
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
    <div className="min-h-screen bg-[#f2f6fa] p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4">
        <div className="flex items-center gap-4">
          <img src="/police-avatar.png" alt="Police Avatar" className="w-12 h-12 rounded-full border-2 border-blue-800 shadow" />
          <div>
            <h1 className="text-2xl font-bold text-[#24346D]">Good Afternoon, Officer Sharma</h1>
            <p className="text-sm text-gray-600">Role: Patrol Supervisor</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center gap-2">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884l8-3.2a1 1 0 01.994 0l8 3.2A1 1 0 0119 6.764V15a2 2 0 01-2 2H3a2 2 0 01-2-2V6.764a1 1 0 01.003-.88zM11 17v-2H9v2h2zm-1-4a1 1 0 100-2 1 1 0 000 2z"></path></svg>
            Emergency Call
          </button>
          <span className="text-lg font-mono text-gray-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-fr">
        {/* Emergency Calls */}
        <div className="col-span-1 min-w-[270px] max-w-full">
          <EmergencyCalls calls={emergencyCalls} />
        </div>
        {/* Active Cases */}
        <div className="col-span-1 min-w-[270px] max-w-full">
          <ActiveCases cases={activeCases} />
        </div>
        {/* Police Chat */}
        <div className="col-span-1 min-w-[320px] max-w-full xl:col-span-1">
          <Chat messages={chatMessages} />
        </div>
        {/* Live Map */}
        <div className="col-span-1 min-w-[320px] max-w-full xl:col-span-1">
          <Map locations={locations} activeUsers={activeUsers} />
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;