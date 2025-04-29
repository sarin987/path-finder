-- Table for fire incidents
CREATE TABLE IF NOT EXISTS fire_incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  reported_at DATETIME NOT NULL,
  type VARCHAR(100) NOT NULL
);

-- Table for fire resource status
CREATE TABLE IF NOT EXISTS fire_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trucks INT NOT NULL,
  personnel INT NOT NULL,
  hoses INT NOT NULL,
  updated_at DATETIME NOT NULL
);
