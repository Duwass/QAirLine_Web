/// <reference types="jest" />
// Test routes cho booking service - Bao phủ đầy đủ: happy path + error cases
import request from 'supertest';
import express from 'express';
import bookingRoutes from '../src/routes/bookingRoutes';
import connection from '../src/database/database';

// Mock kết nối database
jest.mock('../src/database/database', () => ({
  __esModule: true,
  default: {
    execute: jest.fn(),
    query: jest.fn(),
  },
}));

const mockExecute = connection.execute as jest.Mock;
const mockQuery = connection.query as jest.Mock;

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

describe('Booking Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/bookings/BookFlights', () => {
    describe('Trường hợp thành công', () => {
      it('nên đặt vé chuyến bay thành công', async () => {
        // Mock user tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ UserID: 1 }]);
        });
        // Mock chuyến bay tồn tại và có ghế trống
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ FlightID: 1, SeatsAvailable: 10 }]);
        });
        // Mock thêm booking vào database
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 123 });
        });
        // Mock cập nhật số ghế
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Flight booked successfully');
        expect(response.body.bookingId).toBe(123);
        
        // Kiểm tra thứ tự gọi các hàm
        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu userID', async () => {
        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ flightID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu flightID', async () => {
        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu cả hai trường', async () => {
        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi user không tồn tại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Kết quả rỗng - không tìm thấy user
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 999, flightID: 1 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
        expect(mockQuery).toHaveBeenCalledTimes(1);
        expect(mockExecute).not.toHaveBeenCalled();
      });

      it('nên trả về 404 khi chuyến bay không tồn tại', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ UserID: 1 }]);
        });
        // Không tìm thấy chuyến bay
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []); // Kết quả rỗng
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 999 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Flight not found');
        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockExecute).not.toHaveBeenCalled();
      });
    });

    describe('Lỗi logic nghiệp vụ', () => {
      it('nên trả về 400 khi không còn ghế trống', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ UserID: 1 }]);
        });
        // Chuyến bay tồn tại nhưng SeatsAvailable = 0
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ FlightID: 1, SeatsAvailable: 0 }]);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('No seats available on this flight');
        expect(mockExecute).not.toHaveBeenCalled();
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi kiểm tra user thất bại', async () => {
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('DB connection failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error checking user/i);
      });

      it('nên trả về 500 khi kiểm tra chuyến bay thất bại', async () => {
        // Kiểm tra user thành công
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ UserID: 1 }]);
        });
        // Kiểm tra chuyến bay thất bại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('DB error'), null);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error checking flight/i);
      });

      it('nên trả về 500 khi tạo booking thất bại', async () => {
        // User tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ UserID: 1 }]);
        });
        // Chuyến bay tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ FlightID: 1, SeatsAvailable: 5 }]);
        });
        // Thêm booking thất bại
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Insert failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/BookFlights')
          .send({ userID: 1, flightID: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error creating booking/i);
        // Số ghế KHÔNG nên được cập nhật nếu tạo booking thất bại
        expect(mockExecute).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('POST /api/bookings/CancelBooking', () => {
    describe('Trường hợp thành công', () => {
      it('nên hủy booking thành công', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Booking cancelled successfully');
        expect(mockExecute).toHaveBeenCalledTimes(1);
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu bookingId', async () => {
        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing booking id/i);
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi booking không tồn tại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 0 }); // Không có bản ghi nào bị ảnh hưởng
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 999 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Booking not found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi cập nhật database thất bại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Database error'), null);
        });

        const response = await request(app)
          .post('/api/bookings/CancelBooking')
          .send({ bookingId: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error cancelling booking/i);
      });
    });
  });

  describe('GET /api/bookings/', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về tất cả bookings thành công', async () => {
        const mockBookings = [
          { BookingID: 1, UserID: 1, FlightID: 1 },
          { BookingID: 2, UserID: 2, FlightID: 2 }
        ];
        
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, mockBookings);
        });

        const response = await request(app).get('/api/bookings/');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockBookings);
        expect(response.body.length).toBe(2);
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi không có booking nào', async () => {
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, []); // Mảng rỗng
        });

        const response = await request(app).get('/api/bookings/');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No bookings found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(new Error('Database connection lost'), null);
        });

        const response = await request(app).get('/api/bookings/');

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/internal server error/i);
      });
    });
  });

  describe('GET /api/bookings/user/:userId', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về các bookings của user thành công', async () => {
        const mockBookings = [
          { BookingID: 1, UserID: 1, FlightID: 1 },
          { BookingID: 3, UserID: 1, FlightID: 3 }
        ];

        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, mockBookings);
        });

        const response = await request(app).get('/api/bookings/user/1');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockBookings);
        // Kiểm tra tham số userId đã được truyền đúng
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          ['1'],
          expect.any(Function)
        );
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi user không có booking nào', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app).get('/api/bookings/user/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No bookings found for this user');
      });
    });

    describe('Validation', () => {
      it('nên xử lý tham số userId dạng số đúng cách', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [{ BookingID: 1, UserID: 123 }]);
        });

        const response = await request(app).get('/api/bookings/user/123');

        expect(response.status).toBe(200);
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          ['123'],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Query timeout'), null);
        });

        const response = await request(app).get('/api/bookings/user/1');

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error fetching bookings/i);
      });
    });
  });

  describe('DELETE /api/bookings/', () => {
    it('nên xử lý yêu cầu xóa booking', async () => {
      mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
        callback(null, { affectedRows: 1 });
      });

      const response = await request(app)
        .delete('/api/bookings/')
        .send({ bookingId: 1 });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/bookings/payment', () => {
    describe('Trường hợp thành công', () => {
      it('nên xử lý thanh toán thành công', async () => {
        // Mock thêm payment
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 456 });
        });
        // Mock cập nhật booking
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1, amount: 100 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Payment processed successfully');
        expect(response.body.paymentId).toBe(456);
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu bookingId', async () => {
        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ amount: 100 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu amount', async () => {
        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1 });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu cả hai trường', async () => {
        const response = await request(app)
          .post('/api/bookings/payment')
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi thêm payment thất bại', async () => {
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Insert payment failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1, amount: 100 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error processing payment/i);
        // Không nên cập nhật booking nếu thêm payment thất bại
        expect(mockExecute).toHaveBeenCalledTimes(1);
      });

      it('nên trả về 500 khi cập nhật booking thất bại sau khi tạo payment', async () => {
        // Thêm payment thành công
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 456 });
        });
        // Cập nhật booking thất bại
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Update booking failed'), null);
        });

        const response = await request(app)
          .post('/api/bookings/payment')
          .send({ bookingId: 1, amount: 100 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/payment processed but failed to update booking/i);
        expect(mockExecute).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('DELETE /api/bookings/', () => {
    describe('Trường hợp thành công', () => {
      it('nên xóa booking thành công', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .delete('/api/bookings/')
          .send({ bookingId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Booking deleted successfully');
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu bookingId', async () => {
        const response = await request(app)
          .delete('/api/bookings/')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing booking id/i);
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi booking không tồn tại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 0 });
        });

        const response = await request(app)
          .delete('/api/bookings/')
          .send({ bookingId: 999 });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Booking not found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi xóa database thất bại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Foreign key constraint'), null);
        });

        const response = await request(app)
          .delete('/api/bookings/')
          .send({ bookingId: 1 });

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error deleting booking/i);
      });
    });
  });

  describe('GET /api/bookings/payment/:bookingId', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về payment thành công', async () => {
        const mockPayment = { PaymentID: 1, BookingID: 1, Amount: 100, PaymentStatus: 'completed' };
        
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [mockPayment]);
        });

        const response = await request(app).get('/api/bookings/payment/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockPayment);
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          ['1'],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi payment không tồn tại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, []); // Kết quả rỗng
        });

        const response = await request(app).get('/api/bookings/payment/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No payment found for this booking');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Connection timeout'), null);
        });

        const response = await request(app).get('/api/bookings/payment/1');

        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/error fetching payment/i);
      });
    });
  });

  describe('Invalid routes', () => {
    it('nên trả về 404 cho route không tồn tại', async () => {
      const response = await request(app).get('/api/bookings/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
