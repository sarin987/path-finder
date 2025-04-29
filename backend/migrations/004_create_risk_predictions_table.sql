CREATE TABLE IF NOT EXISTS risk_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  risk_type VARCHAR(50),
  lat DOUBLE,
  lng DOUBLE,
  risk_level VARCHAR(20),
  prediction_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);
