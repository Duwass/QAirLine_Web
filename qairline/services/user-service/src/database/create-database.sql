-- Drop database if exists
DROP SCHEMA IF EXISTS `user_service_db`;
CREATE SCHEMA IF NOT EXISTS `user_service_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `user_service_db`;

-- Users table
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Username VARCHAR(100) UNIQUE,
    Email VARCHAR(100) UNIQUE,
    Password VARCHAR(255),
    Role ENUM('Customer', 'Admin', 'Non-Customer') NOT NULL
);

-- Insert sample data
INSERT INTO Users (Name, Username, Email, Password, Role)
VALUES
    ('John Doe', 'john_doe', 'john@example.com', 'password123', 'Customer'),
    ('Jane Smith', 'jane_smith', 'jane@example.com', 'password456', 'Customer'),
    ('Alice Johnson', 'alice_johnson', 'alice@example.com', 'password789', 'Admin'),
    ('Bob Brown', 'bob_brown', 'bob@example.com', 'password101', 'Customer');