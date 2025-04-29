CREATE TABLE IF NOT EXISTS checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  scheduled_time DATETIME NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  location_lat DOUBLE,
  location_lng DOUBLE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at DATETIME
);
