import React, { useEffect, useState } from 'react';
import { FaChild, FaSchool, FaBus, FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Sidebar from '../common/Sidebar';
import EmergencyCalls from './ParentDashboard/EmergencyCalls';
import Chat from '../common/Chat';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [schools, setSchools] = useState([]);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    // TODO: Fetch children, schools, and buses from backend
    setChildren([
      { id: 1, name: 'Alice', status: 'At School' },
      { id: 2, name: 'Bob', status: 'On Bus' }
    ]);
    setSchools([
      { id: 1, name: 'Springfield Elementary' },
      { id: 2, name: 'Shelbyville High' }
    ]);
    setBuses([
      { id: 1, route: 'Route 1', status: 'Running' },
      { id: 2, route: 'Route 2', status: 'Delayed' }
    ]);
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar role="parent" />
      <div style={{ flex: 1 }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                <FaBell className="text-gray-600" />
              </button>
              <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                <FaChild className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Emergency Calls */}
          <motion.div className="bg-white rounded-lg shadow p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Calls</h2>
            <EmergencyCalls />
          </motion.div>

          {/* Chat */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat</h2>
            <Chat />
          </div>

          {/* Children */}
          <motion.div className="bg-white rounded-lg shadow p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Children</h2>
            <ul>
              {children.length === 0 ? <li>No children found.</li> : children.map((child) => (
                <li key={child.id} className="mb-2">
                  <span className="font-bold">{child.name}</span> - {child.status}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Schools */}
          <motion.div className="bg-white rounded-lg shadow p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Schools</h2>
            <ul>
              {schools.length === 0 ? <li>No schools found.</li> : schools.map((school) => (
                <li key={school.id} className="mb-2">
                  <span className="font-bold">{school.name}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Buses */}
          <motion.div className="bg-white rounded-lg shadow p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Buses</h2>
            <ul>
              {buses.length === 0 ? <li>No buses found.</li> : buses.map((bus) => (
                <li key={bus.id} className="mb-2">
                  <span className="font-bold">{bus.route}</span> - {bus.status}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Live Map */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Live Map</h2>
              <p className="text-sm text-gray-500">Real-time bus and child locations</p>
            </div>
            <div className="relative h-[300px]">
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                Map will be loaded here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;