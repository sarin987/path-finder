// src/components/common/Header.js
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUserCircle, 
  FaBell, 
  FaEnvelope, 
  FaCog 
} from 'react-icons/fa';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <h2>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard</h2>
      </div>
      <div className="header-right">
        <div className="notifications">
          <FaBell />
          <span className="badge">3</span>
        </div>
        <div className="messages">
          <FaEnvelope />
          <span className="badge">2</span>
        </div>
        <div className="user-profile">
          <FaUserCircle />
          <div className="user-info">
            <span>{user?.name || 'User'}</span>
            <span className="role">{user?.role}</span>
          </div>
          <FaCog className="settings" />
        </div>
      </div>
    </header>
  );
};

export default Header;