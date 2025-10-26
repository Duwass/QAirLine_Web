-- Drop database if exists
DROP SCHEMA IF EXISTS `flight_service_db`;
CREATE SCHEMA IF NOT EXISTS `flight_service_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `flight_service_db`;

-- Aircrafts table
CREATE TABLE Aircrafts (
    AircraftID int AUTO_INCREMENT PRIMARY KEY,
    Model VARCHAR(100),
    Manufacturer VARCHAR(100),
    Capacity INT,
    RangeKm INT COMMENT 'Range in kilometers',
    Description TEXT COMMENT 'Additional details about the aircraft'
);

-- Flights table
CREATE TABLE Flights (
    FlightID INT AUTO_INCREMENT PRIMARY KEY,
    AircraftTypeID INT,
    Departure VARCHAR(100),
    Arrival VARCHAR(100),
    DepartureTime DATETIME,
    ArrivalTime DATETIME,
    Price DECIMAL(10, 2),
    SeatsAvailable INT,
    Status ENUM('on-time', 'delayed', 'cancelled') DEFAULT 'on-time',
    FOREIGN KEY (AircraftTypeID) REFERENCES Aircrafts(AircraftID)
);

-- Insert sample data
INSERT INTO Aircrafts (Model, Manufacturer, Capacity, RangeKm, Description)
VALUES 
    ('Boeing 737', 'Boeing', 180, 5600, 'Short to medium-range twinjet'),
    ('Airbus A320', 'Airbus', 150, 6100, 'Short to medium-range commercial passenger jet'),
    ('Boeing 787', 'Boeing', 330, 14800, 'Long-range wide-body twin-engine jet airliner');

INSERT INTO Flights (AircraftTypeID, Departure, Arrival, DepartureTime, ArrivalTime, Price, SeatsAvailable, Status)
VALUES
    (1, 'Ho Chi Minh', 'Ha Noi', '2024-12-01 08:00:00', '2024-12-01 10:00:00', 500.00, 150, 'on-time'),
    (2, 'Da Nang', 'Ha Noi', '2024-12-15 21:00:00', '2024-12-16 09:00:00', 800.00, 200, 'on-time'),
    (3, 'Ha Noi', 'Da Nang', '2024-12-20 22:00:00', '2024-12-21 07:00:00', 1000.00, 250, 'on-time');