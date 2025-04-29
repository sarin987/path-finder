CREATE TABLE IF NOT EXISTS hospital_beds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_name VARCHAR(100),
  total_beds INT,
  available_beds INT,
  lat DOUBLE,
  lng DOUBLE,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
