CREATE TABLE IF NOT EXISTS incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type VARCHAR(50),
  description TEXT,
  photo_url VARCHAR(255),
  lat DOUBLE,
  lng DOUBLE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
