-- Drop database if exists
DROP SCHEMA IF EXISTS `booking_service_db`;
CREATE SCHEMA IF NOT EXISTS `booking_service_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `booking_service_db`;

-- Bookings table
CREATE TABLE Bookings (
    BookingID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    FlightID INT NOT NULL,
    BookingStatus ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
    PaymentStatus ENUM('paid', 'unpaid') DEFAULT 'unpaid',
    BookingDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE Payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID INT NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    PaymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    PaymentStatus ENUM('completed', 'pending', 'failed') DEFAULT 'pending',
    FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO Bookings (UserID, FlightID, BookingStatus, PaymentStatus, BookingDate)
VALUES
    (1, 1, 'confirmed', 'paid', '2024-12-01 10:00:00'),
    (2, 2, 'confirmed', 'unpaid', '2024-12-02 14:30:00'),
    (3, 3, 'cancelled', 'paid', '2024-12-05 16:00:00'),
    (4, 1, 'confirmed', 'paid', '2024-12-07 18:30:00');

INSERT INTO Payments (BookingID, Amount, PaymentDate, PaymentStatus)
VALUES
    (1, 500.00, '2024-12-01 10:05:00', 'completed'),
    (2, 800.00, '2024-12-02 15:00:00', 'pending'),
    (3, 1000.00, '2024-12-05 16:30:00', 'completed'),
    (4, 500.00, '2024-12-07 19:00:00', 'completed');