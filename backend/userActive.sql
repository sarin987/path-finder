-- Add active and last_seen columns to users table
ALTER TABLE users ADD COLUMN active TINYINT(1) DEFAULT 0;
ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT NULL;
