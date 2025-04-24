// src/components/dashboard/ParentDashboard.js
import React from 'react';
import { FaUser, FaMapMarkerAlt, FaChild, FaSchool, FaBus, FaClock, FaHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ParentDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
            <FaHeart className="text-gray-600" />
          </button>
          <button className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
            <FaChild className="text-gray-600" />
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
              <p className="text-sm text-gray-500">Children</p>
              <h3 className="text-3xl font-bold text-gray-800">2</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaChild className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Children in your care</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Schools</p>
              <h3 className="text-3xl font-bold text-gray-800">3</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaSchool className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Number of schools</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Buses</p>
              <h3 className="text-3xl font-bold text-gray-800">1</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FaBus className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Number of buses</p>
        </motion.div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Live Map</h2>
          <p className="text-sm text-gray-500">Real-time bus locations</p>
        </div>
        <div className="relative h-[400px]">
          <div className="w-full h-full bg-gray-100 rounded-lg">
            <div className="flex items-center justify-center h-full text-gray-500">
              Map will be loaded here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard; 