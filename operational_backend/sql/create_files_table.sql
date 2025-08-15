-- Drop existing Files table if it exists
DROP TABLE IF EXISTS `Files`;

-- Create Files table
CREATE TABLE `Files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `storage_path` varchar(500) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `message_id` int(11) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `message_id` (`message_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add sample data for testing
INSERT INTO `Files` (`original_name`, `mime_type`, `size`, `storage_path`, `user_id`, `message_id`) VALUES
('test.txt', 'text/plain', 1234, '/uploads/test.txt', 1, NULL),
('image.jpg', 'image/jpeg', 56789, '/uploads/image.jpg', 1, 1);

-- Show the structure of the created table
DESCRIBE `Files`;

-- Show the sample data
SELECT * FROM `Files`;
