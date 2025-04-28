-- Create database
CREATE DATABASE IF NOT EXISTS safety_emergency_db;
USE safety_emergency_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'police', 'hospital', 'ambulance') DEFAULT 'user',
    gender ENUM('male', 'female', 'other') NOT NULL,
    profile_picture VARCHAR(255),
    user_verified BOOLEAN DEFAULT false,
    auth_provider ENUM('email', 'google', 'phone') DEFAULT 'phone',
    last_location POINT,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Emergency Services table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('police', 'hospital', 'ambulance') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location POINT NOT NULL SRID 4326,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Police Stations table
CREATE TABLE IF NOT EXISTS police_stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    jurisdiction_area TEXT,
    officer_in_charge VARCHAR(255),
    FOREIGN KEY (service_id) REFERENCES services(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    specializations TEXT,
    bed_capacity INT,
    emergency_capacity BOOLEAN DEFAULT true,
    FOREIGN KEY (service_id) REFERENCES services(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ambulances table
CREATE TABLE IF NOT EXISTS ambulances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    ambulance_type ENUM('basic', 'advanced', 'patient-transport') DEFAULT 'basic',
    capacity INT DEFAULT 1,
    is_available BOOLEAN DEFAULT true,
    FOREIGN KEY (service_id) REFERENCES services(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Emergency Requests table
CREATE TABLE emergency_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  location JSON NOT NULL,
  timestamp DATETIME NOT NULL,
  status ENUM('pending', 'active', 'resolved') DEFAULT 'pending'
);

-- Emergency Response Log table
CREATE TABLE IF NOT EXISTS emergency_response_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    responder_id INT NOT NULL,
    action_taken TEXT,
    response_time TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES emergency_requests(id),
    FOREIGN KEY (responder_id) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT,
    message TEXT NOT NULL,
    chat_type ENUM('user','police','admin','hospital','ambulance') NOT NULL,
    emergency_request_id INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (emergency_request_id) REFERENCES emergency_requests(id)
);

-- Add spatial indexes for faster location-based queries
ALTER TABLE services ADD SPATIAL INDEX(location);

-- Add regular indexes for frequently queried columns
ALTER TABLE users ADD INDEX idx_phone (phone);
ALTER TABLE users ADD INDEX idx_firebase_uid (firebase_uid);
ALTER TABLE services ADD INDEX idx_type (type);
