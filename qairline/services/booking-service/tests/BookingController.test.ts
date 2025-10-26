/// <reference types="jest" />
/**
 * Test BookingController - Unit tests cho các phương thức controller
 * Kiểm tra logic nghiệp vụ của từng method: createBooking, getAllBookings, getUserBookings, 
 * cancelBooking, processPayment, getPaymentByBookingId, deleteBooking
 */
import type { Request, Response } from 'express';
import { BookingController } from '../src/controllers/BookingController';
import connection from '../src/database/database';

// Mock database connection để tránh kết nối thật
jest.mock('../src/database/database', () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
    query: jest.fn()
  }
}));

describe('BookingController', () => {
  let bookingController: BookingController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Khởi tạo controller và mock objects trước mỗi test
    bookingController = new BookingController();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    // Xóa tất cả mock calls
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('nên tạo booking mới thành công', () => {
      // Chuẩn bị dữ liệu đầu vào
      mockRequest.body = {
        userId: 1,
        flightId: 1
      };

      const mockResult = { insertId: 1 };

      // Mock database execute trả về insertId
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      // Gọi method createBooking
      bookingController.createBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 201 với bookingId
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking created successfully',
        bookingId: 1
      });
    });

    it('nên trả về 400 khi thiếu trường bắt buộc', () => {
      // Request body rỗng
      mockRequest.body = {};

      // Gọi method createBooking
      bookingController.createBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing required fields'
      });
    });

    it('nên xử lý lỗi database khi tạo booking', () => {
      // Chuẩn bị dữ liệu đầu vào
      mockRequest.body = {
        userId: 1,
        flightId: 1
      };

      // Mock database execute trả về error
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(new Error('Database error'), null);
      });

      // Gọi method createBooking
      bookingController.createBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 500 với thông báo lỗi
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating booking',
        error: 'Database error'
      });
    });
  });

  describe('getAllBookings', () => {
    it('nên trả về tất cả bookings thành công', () => {
      // Mock dữ liệu bookings từ database
      const mockBookings = [
        {
          BookingID: 1,
          UserID: 1,
          FlightID: 1,
          BookingStatus: 'confirmed',
          PaymentStatus: 'paid',
          BookingDate: '2024-12-01 10:00:00'
        }
      ];

      // Mock database query trả về danh sách bookings
      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(null, mockBookings);
      });

      // Gọi method getAllBookings
      bookingController.getAllBookings(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 200 với danh sách bookings
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBookings);
    });

    it('nên trả về 404 khi không tìm thấy booking nào', () => {
      // Mock database query trả về mảng rỗng
      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(null, []);
      });

      // Gọi method getAllBookings
      bookingController.getAllBookings(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 404
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No bookings found'
      });
    });
  });

  describe('getUserBookings', () => {
    it('nên trả về bookings của user thành công', () => {
      // Chuẩn bị userId trong params
      mockRequest.params = { userId: '1' };

      // Mock dữ liệu bookings của user
      const mockBookings = [
        {
          BookingID: 1,
          UserID: 1,
          FlightID: 1,
          BookingStatus: 'confirmed',
          PaymentStatus: 'paid',
          BookingDate: '2024-12-01 10:00:00'
        }
      ];

      // Mock database execute trả về bookings của user
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockBookings);
      });

      // Gọi method getUserBookings
      bookingController.getUserBookings(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 200 với bookings của user
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBookings);
    });

    it('nên trả về 404 khi user không có booking nào', () => {
      // Chuẩn bị userId không tồn tại
      mockRequest.params = { userId: '999' };

      // Mock database execute trả về mảng rỗng
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      // Gọi method getUserBookings
      bookingController.getUserBookings(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 404
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No bookings found for this user'
      });
    });
  });

  describe('cancelBooking', () => {
    it('nên hủy booking thành công', () => {
      // Chuẩn bị bookingId trong body
      mockRequest.body = { bookingId: 1 };

      const mockResult = { affectedRows: 1 };

      // Mock database execute cập nhật status thành cancelled
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      // Gọi method cancelBooking
      bookingController.cancelBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking cancelled successfully'
      });
    });

    it('nên trả về 400 khi thiếu booking ID', () => {
      // Request body không có bookingId
      mockRequest.body = {};

      // Gọi method cancelBooking
      bookingController.cancelBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing booking ID'
      });
    });

    it('nên trả về 404 khi booking không tồn tại', () => {
      // Chuẩn bị bookingId không tồn tại
      mockRequest.body = { bookingId: 999 };

      const mockResult = { affectedRows: 0 };

      // Mock database execute không cập nhật được bản ghi nào
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      // Gọi method cancelBooking
      bookingController.cancelBooking(mockRequest as Request, mockResponse as Response);
      bookingController.cancelBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 404
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking not found'
      });
    });
  });

  describe('processPayment', () => {
    it('nên xử lý thanh toán thành công', () => {
      // Chuẩn bị dữ liệu payment
      mockRequest.body = {
        bookingId: 1,
        amount: 500
      };

      const mockResult = { insertId: 1 };

      // Mock database execute cho cả INSERT payment và UPDATE booking
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        if (query.includes('INSERT INTO Payments')) {
          // Thêm payment record thành công
          callback(null, mockResult);
        } else if (query.includes('UPDATE Bookings')) {
          // Cập nhật payment status của booking thành công
          callback(null, { affectedRows: 1 });
        }
      });

      // Gọi method processPayment
      bookingController.processPayment(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 200 với paymentId
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Payment processed successfully',
        paymentId: 1
      });
    });

    it('nên trả về 400 khi thiếu trường bắt buộc', () => {
      // Request body rỗng
      mockRequest.body = {};

      // Gọi method processPayment
      bookingController.processPayment(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing required fields'
      });
    });
  });

  describe('getPaymentByBookingId', () => {
    it('nên trả về payment thành công', () => {
      // Chuẩn bị bookingId trong params
      mockRequest.params = { bookingId: '1' };

      // Mock dữ liệu payment
      const mockPayment = {
        PaymentID: 1,
        BookingID: 1,
        Amount: 500,
        PaymentDate: '2024-12-01 10:05:00',
        PaymentStatus: 'completed'
      };

      // Mock database execute trả về payment record
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, [mockPayment]);
      });

      // Gọi method getPaymentByBookingId
      bookingController.getPaymentByBookingId(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 200 với payment data
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPayment);
    });

    it('nên trả về 404 khi không tìm thấy payment', () => {
      // Chuẩn bị bookingId không có payment
      mockRequest.params = { bookingId: '999' };

      // Mock database execute trả về mảng rỗng
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      // Gọi method getPaymentByBookingId
      bookingController.getPaymentByBookingId(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 404
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No payment found for this booking'
      });
    });
  });

  describe('deleteBooking', () => {
    it('nên xóa booking thành công', () => {
      // Chuẩn bị bookingId trong body
      mockRequest.body = { bookingId: 1 };

      const mockResult = { affectedRows: 1 };

      // Mock database execute xóa booking record
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      // Gọi method deleteBooking
      bookingController.deleteBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 200
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking deleted successfully'
      });
    });

    it('nên trả về 400 khi thiếu booking ID', () => {
      // Request body không có bookingId
      mockRequest.body = {};

      // Gọi method deleteBooking
      bookingController.deleteBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing booking ID'
      });
    });

    it('nên trả về 404 khi booking không tồn tại', () => {
      // Chuẩn bị bookingId không tồn tại
      mockRequest.body = { bookingId: 999 };

      const mockResult = { affectedRows: 0 };

      // Mock database execute không xóa được bản ghi nào
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, mockResult);
      });

      // Gọi method deleteBooking
      bookingController.deleteBooking(mockRequest as Request, mockResponse as Response);

      // Kiểm tra response trả về 404
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Booking not found'
      });
    });
  });
});