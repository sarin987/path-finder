// src/components/dashboard/AmbulanceDashboard.js
import React from 'react';
import { FaAmbulance, FaHeartbeat, FaUserInjured, FaMapMarkerAlt, FaChartLine, FaUsers, FaBell } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AmbulanceDashboard = () => {
  return (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Active Calls</p>
              <h3 className="text-3xl font-bold text-gray-800">8</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaBell className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Current emergency calls</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Patients</p>
              <h3 className="text-3xl font-bold text-gray-800">25</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaUserInjured className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Total patients today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Response Time</p>
              <h3 className="text-3xl font-bold text-gray-800">5.2</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaChartLine className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Average response time (minutes)</p>
        </motion.div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Live Map</h2>
          <p className="text-sm text-gray-500">Real-time patient locations</p>
        </div>
        <div className="relative h-[400px]">
          <div className="w-full h-full bg-gray-100 rounded-lg">
            <div className="flex items-center justify-center h-full text-gray-500">
              Map will be loaded here
            </div>
          </div>
        </div>
      </div>

      {/* Active Calls */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Active Calls</h2>
          <p className="text-sm text-gray-500">Current emergency calls</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FaHeartbeat className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Heart Attack</h3>
                  <p className="text-sm text-gray-500">123 Main St, City</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs text-blue-600 bg-blue-100 rounded-full">
                Critical
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <FaAmbulance className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Accident</h3>
                  <p className="text-sm text-gray-500">Intersection A12</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                In Progress
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FaUserInjured className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Fall</h3>
                  <p className="text-sm text-gray-500">Residential Area</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs text-blue-600 bg-blue-100 rounded-full">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceDashboard;