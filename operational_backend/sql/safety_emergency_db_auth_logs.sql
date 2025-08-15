CREATE DATABASE  IF NOT EXISTS `safety_emergency_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `safety_emergency_db`;
-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: 139.59.40.236    Database: safety_emergency_db
-- ------------------------------------------------------
-- Server version	8.0.41-0ubuntu0.24.10.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_logs`
--

DROP TABLE IF EXISTS `auth_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) DEFAULT NULL,
  `action` enum('OTP_REQUEST','LOGIN_ATTEMPT','PASSWORD_RESET','ACCOUNT_UPDATE') DEFAULT NULL,
  `status` enum('SUCCESS','FAILED') DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_logs`
--

LOCK TABLES `auth_logs` WRITE;
/*!40000 ALTER TABLE `auth_logs` DISABLE KEYS */;
INSERT INTO `auth_logs` VALUES (1,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:26:59'),(2,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:38:02'),(3,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:39:07'),(4,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:40:48'),(5,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:42:27'),(6,'+917758046511','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:43:03'),(7,'+917758046511','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:45:18'),(8,'+917758046511','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:45:21'),(9,'+917758046511','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:45:23'),(10,'+917758046511','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:49:49'),(11,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:52:37'),(12,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:56:48'),(13,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:57:06'),(14,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:57:48'),(15,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:58:13'),(16,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.verifyPhoneNumber is not a function','2025-03-26 13:58:30'),(17,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.listSignInMethodsForEmail is not a function','2025-03-26 14:07:33'),(18,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','auth.listSignInMethodsForEmail is not a function','2025-03-26 14:09:24'),(19,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','admin.auth(...).listSignInMethodsForEmail is not a function','2025-03-26 14:10:33'),(20,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','window is not defined','2025-03-26 14:29:25'),(21,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','window is not defined','2025-03-26 14:30:03'),(22,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','window is not defined','2025-03-26 14:35:10'),(23,'+919604023406','OTP_REQUEST','FAILED','::ffff:192.168.14.104','window is not defined','2025-03-26 14:37:37');
/*!40000 ALTER TABLE `auth_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-27 13:19:04
