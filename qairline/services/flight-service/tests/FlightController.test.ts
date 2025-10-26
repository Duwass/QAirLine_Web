/// <reference types="jest" />
/**
 * Test FlightController - Unit tests cho các phương thức controller
 * Kiểm tra logic nghiệp vụ: getAllFlights, createFlight, updateFlightStatus, 
 * deleteFlight, searchFlights
 */
import type { Request, Response } from 'express';
import { FlightController } from '../src/controllers/FlightController';
import connection from '../src/database/database';

// Mock database connection để tránh kết nối thật
jest.mock('../src/database/database', () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

describe('FlightController', () => {
  let flightController: FlightController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    flightController = new FlightController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllFlights', () => {
    it('should return all flights successfully', () => {
      const mockFlights = [
        {
          FlightID: 1,
          AircraftTypeID: 1,
          Departure: 'Ho Chi Minh',
          Arrival: 'Ha Noi',
          DepartureTime: '2024-12-01 08:00:00',
          ArrivalTime: '2024-12-01 10:00:00',
          Price: 500.00,
          SeatsAvailable: 150,
          Status: 'on-time'
        }
      ];

      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(null, mockFlights);
      });

      flightController.getAllFlights(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockFlights);
    });

    it('should return 404 when no flights found', () => {
      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(null, []);
      });

      flightController.getAllFlights(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No flights found'
      });
    });

    it('should handle database error', () => {
      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(new Error('Database error'), null);
      });

      flightController.getAllFlights(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
        error: 'Database error'
      });
    });
  });

  describe('createFlight', () => {
    it('should create a new flight successfully', () => {
      mockRequest.body = {
        aircraftTypeId: 1,
        departure: 'Ho Chi Minh',
        arrival: 'Ha Noi',
        departureTime: '2024-12-01 08:00:00',
        arrivalTime: '2024-12-01 10:00:00',
        price: 500,
        seatsAvailable: 150
      };

      const mockResult = { insertId: 1 };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      flightController.createFlight(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Flight created successfully',
        flightId: 1
      });
    });

    it('should handle database error during creation', () => {
      mockRequest.body = {
        aircraftTypeId: 1,
        departure: 'Ho Chi Minh',
        arrival: 'Ha Noi',
        departureTime: '2024-12-01 08:00:00',
        arrivalTime: '2024-12-01 10:00:00',
        price: 500,
        seatsAvailable: 150
      };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(new Error('Database error'), null);
      });

      flightController.createFlight(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating flight',
        error: 'Database error'
      });
    });
  });

  describe('updateFlightStatus', () => {
    it('should update flight status successfully', () => {
      mockRequest.body = {
        flightId: 1,
        status: 'delayed'
      };

      const mockResult = { affectedRows: 1 };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      flightController.updateFlightStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Flight status updated successfully'
      });
    });

    it('should return 400 when missing required fields', () => {
      mockRequest.body = {};

      flightController.updateFlightStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing required fields'
      });
    });

    it('should return 404 when flight not found', () => {
      mockRequest.body = {
        flightId: 999,
        status: 'delayed'
      };

      const mockResult = { affectedRows: 0 };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      flightController.updateFlightStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Flight not found'
      });
    });
  });

  describe('deleteFlight', () => {
    it('should delete flight successfully', () => {
      mockRequest.body = { flightId: 1 };

      const mockResult = { affectedRows: 1 };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      flightController.deleteFlight(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Flight deleted successfully'
      });
    });

    it('should return 400 when missing flight ID', () => {
      mockRequest.body = {};

      flightController.deleteFlight(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing flight ID'
      });
    });

    it('should return 404 when flight not found', () => {
      mockRequest.body = { flightId: 999 };

      const mockResult = { affectedRows: 0 };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      flightController.deleteFlight(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Flight not found'
      });
    });
  });

  describe('searchFlights', () => {
    it('should search flights successfully', () => {
      mockRequest.body = {
        departure: 'Ho Chi Minh',
        arrival: 'Ha Noi'
      };

      const mockFlights = [
        {
          FlightID: 1,
          AircraftTypeID: 1,
          Departure: 'Ho Chi Minh',
          Arrival: 'Ha Noi',
          DepartureTime: '2024-12-01 08:00:00',
          ArrivalTime: '2024-12-01 10:00:00',
          Price: 500.00,
          SeatsAvailable: 150,
          Status: 'on-time'
        }
      ];

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockFlights);
      });

      flightController.searchFlights(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockFlights);
    });

    it('should return 400 when missing search parameters', () => {
      mockRequest.body = {};

      flightController.searchFlights(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing search parameters'
      });
    });

    it('should return 404 when no flights found for route', () => {
      mockRequest.body = {
        departure: 'Ho Chi Minh',
        arrival: 'Ha Noi'
      };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      flightController.searchFlights(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No flights found for the given route'
      });
    });
  });
});