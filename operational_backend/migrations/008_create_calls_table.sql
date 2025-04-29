CREATE TABLE IF NOT EXISTS calls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  call_type VARCHAR(10), -- 'voice' or 'video'
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  location_lat DOUBLE,
  location_lng DOUBLE,
  status VARCHAR(20) DEFAULT 'active'
);
