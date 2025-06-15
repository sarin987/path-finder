import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LocationMap from '../../components/LocationMap';
import UserLocationTracker from '../../components/UserLocationTracker';

const LocationTrackingPage: React.FC = () => {
  const { user, token } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('police'); // eslint-disable-line @typescript-eslint/no-unused-vars

  if (!user || !token) {
    return <div>Please log in to view this page</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Live Location Tracking</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Location</h2>
        <UserLocationTracker 
          token={token} 
          role={user.role} 
        />
      </div>

      <div className="mb-4">
        <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">
          Track Role:
        </label>
        <select
          id="role-select"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="police">Police</option>
          <option value="ambulance">Ambulance</option>
          <option value="fire">Fire Department</option>
          <option value="parent">Parents</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          Live {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Locations
        </h2>
        <LocationMap role={user.role} />
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">How It Works:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
          <li>Your location is automatically tracked and updated every 15 seconds</li>
          <li>Select a role from the dropdown to view locations of different responders</li>
          <li>Click on any marker to see more details about that responder</li>
          <li>The map will automatically center on the available locations</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationTrackingPage;
