-- Database cho Offer Service
-- Quản lý các chương trình khuyến mãi và tin tức

-- Drop database if exists
DROP SCHEMA IF EXISTS `offer_service_db`;
CREATE SCHEMA IF NOT EXISTS `offer_service_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `offer_service_db`;

-- Bảng Offers: lưu thông tin khuyến mãi và tin tức
CREATE TABLE Offers (
    PostID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Content TEXT NOT NULL,
    PostDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Type ENUM('promotion', 'news') DEFAULT 'promotion',
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu
INSERT INTO Offers (Title, Content, PostDate, Type)
VALUES
    ('Holiday Sale', 'Get 20% off on flights this holiday season!', '2024-12-01 12:00:00', 'promotion'),
    ('New Route Available', 'We are now offering flights from Paris to Dubai!', '2024-12-10 08:00:00', 'news'),
    ('Summer Special', 'Book early and save up to 30% on summer flights!', '2024-12-15 10:00:00', 'promotion');