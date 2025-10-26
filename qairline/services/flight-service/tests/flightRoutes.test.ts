/// <reference types="jest" />
/**
 * Test tích hợp routes cho flight service
 * Bao phủ đầy đủ: happy path + validation errors + not found errors + database errors
 */
import request from 'supertest';
import express from 'express';
import flightRoutes from '../src/routes/flightRoutes';

// Mock kết nối database
jest.mock('../src/database/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    execute: jest.fn(),
  }
}));

import connection from '../src/database/database';

const app = express();
app.use(express.json());
app.use('/api/flights', flightRoutes);

describe('Flight Routes Integration Tests', () => {
  let mockQuery: jest.Mock;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    // Reset tất cả mocks trước mỗi test
    jest.clearAllMocks();
    mockQuery = connection.query as jest.Mock;
    mockExecute = connection.execute as jest.Mock;
  });

  describe('GET /api/flights/GetAllFlights', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về tất cả flights thành công', async () => {
        // Mock dữ liệu flights từ database
        const mockFlights = [
          {
            FlightID: 1,
            AircraftTypeID: 1,
            Departure: 'Hanoi',
            Arrival: 'Ho Chi Minh',
            DepartureTime: '2024-12-01 08:00:00',
            ArrivalTime: '2024-12-01 10:00:00',
            Price: 1500000,
            SeatsAvailable: 50,
            Status: 'scheduled'
          },
          {
            FlightID: 2,
            AircraftTypeID: 2,
            Departure: 'Da Nang',
            Arrival: 'Hanoi',
            DepartureTime: '2024-12-01 14:00:00',
            ArrivalTime: '2024-12-01 16:00:00',
            Price: 1200000,
            SeatsAvailable: 30,
            Status: 'scheduled'
          }
        ];

        // Mock query trả về danh sách flights
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, mockFlights);
        });

        const response = await request(app).get('/api/flights/GetAllFlights');

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockFlights);
        expect(response.body.length).toBe(2);
        expect(mockQuery).toHaveBeenCalledTimes(1);
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi không có flight nào', async () => {
        // Mock query trả về mảng rỗng
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app).get('/api/flights/GetAllFlights');

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No flights found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        // Mock query trả về error
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(new Error('Database connection lost'), null);
        });

        const response = await request(app).get('/api/flights/GetAllFlights');

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toMatch(/internal server error/i);
      });
    });
  });

  describe('POST /api/flights/Add', () => {
    describe('Trường hợp thành công', () => {
      it('nên tạo flight mới thành công', async () => {
        const newFlight = {
          aircraftTypeId: 1,
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh',
          departureTime: '2024-12-15 08:00:00',
          arrivalTime: '2024-12-15 10:00:00',
          price: 1500000,
          seatsAvailable: 50
        };

        // Mock execute trả về insertId
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 10 });
        });

        const response = await request(app)
          .post('/api/flights/Add')
          .send(newFlight);

        // Kiểm tra response thành công
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Flight created successfully');
        expect(response.body.flightId).toBe(10);
        expect(mockExecute).toHaveBeenCalledTimes(1);
        // Kiểm tra tham số được truyền đúng
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          [
            newFlight.aircraftTypeId,
            newFlight.departure,
            newFlight.arrival,
            newFlight.departureTime,
            newFlight.arrivalTime,
            newFlight.price,
            newFlight.seatsAvailable
          ],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi thêm flight thất bại', async () => {
        const newFlight = {
          aircraftTypeId: 1,
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh',
          departureTime: '2024-12-15 08:00:00',
          arrivalTime: '2024-12-15 10:00:00',
          price: 1500000,
          seatsAvailable: 50
        };

        // Mock execute trả về error
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Foreign key constraint failed'), null);
        });

        const response = await request(app)
          .post('/api/flights/Add')
          .send(newFlight);

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error creating flight');
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('POST /api/flights/SearchFlight', () => {
    describe('Trường hợp thành công', () => {
      it('nên tìm flights theo departure và arrival thành công', async () => {
        const searchParams = {
          departure: 'Hanoi',
          arrival: 'Ho Chi Minh'
        };

        const mockResults = [
          {
            FlightID: 1,
            Departure: 'Hanoi',
            Arrival: 'Ho Chi Minh',
            DepartureTime: '2024-12-15 08:00:00',
            Price: 1500000
          }
        ];

        // Mock execute trả về kết quả tìm kiếm
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, mockResults);
        });

        const response = await request(app)
          .post('/api/flights/SearchFlight')
          .send(searchParams);

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockResults);
        // Kiểm tra tham số tìm kiếm đúng
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          [searchParams.departure, searchParams.arrival],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu departure', async () => {
        const response = await request(app)
          .post('/api/flights/SearchFlight')
          .send({ arrival: 'Ho Chi Minh' });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing search parameters/i);
        // Không nên gọi database
        expect(mockExecute).not.toHaveBeenCalled();
      });

      it('nên trả về 400 khi thiếu arrival', async () => {
        const response = await request(app)
          .post('/api/flights/SearchFlight')
          .send({ departure: 'Hanoi' });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing search parameters/i);
        expect(mockExecute).not.toHaveBeenCalled();
      });

      it('nên trả về 400 khi thiếu cả hai tham số', async () => {
        const response = await request(app)
          .post('/api/flights/SearchFlight')
          .send({});

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(mockExecute).not.toHaveBeenCalled();
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi không tìm thấy flight nào', async () => {
        // Mock execute trả về mảng rỗng
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app)
          .post('/api/flights/SearchFlight')
          .send({ departure: 'Hanoi', arrival: 'Paris' });

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No flights found for the given route');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi tìm kiếm thất bại', async () => {
        // Mock execute trả về error
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Query timeout'), null);
        });

        const response = await request(app)
          .post('/api/flights/SearchFlight')
          .send({ departure: 'Hanoi', arrival: 'Ho Chi Minh' });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error searching flights');
      });
    });
  });

  describe('PUT /api/flights/status', () => {
    describe('Trường hợp thành công', () => {
      it('nên cập nhật status flight thành công', async () => {
        const updateData = {
          flightId: 1,
          status: 'cancelled'
        };

        // Mock execute cập nhật thành công
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .put('/api/flights/status')
          .send(updateData);

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Flight status updated successfully');
        expect(mockExecute).toHaveBeenCalledWith(
          expect.any(String),
          [updateData.status, updateData.flightId],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu flightId', async () => {
        const response = await request(app)
          .put('/api/flights/status')
          .send({ status: 'cancelled' });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing required fields');
        expect(mockExecute).not.toHaveBeenCalled();
      });

      it('nên trả về 400 khi thiếu status', async () => {
        const response = await request(app)
          .put('/api/flights/status')
          .send({ flightId: 1 });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing required fields');
        expect(mockExecute).not.toHaveBeenCalled();
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi flight không tồn tại', async () => {
        // Mock execute không cập nhật được bản ghi nào
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 0 });
        });

        const response = await request(app)
          .put('/api/flights/status')
          .send({ flightId: 999, status: 'cancelled' });

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Flight not found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi cập nhật database thất bại', async () => {
        // Mock execute trả về error
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Database update failed'), null);
        });

        const response = await request(app)
          .put('/api/flights/status')
          .send({ flightId: 1, status: 'cancelled' });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error updating flight status');
      });
    });
  });

  describe('POST /api/flights/Delete', () => {
    describe('Trường hợp thành công', () => {
      it('nên xóa flight thành công', async () => {
        // Mock execute xóa thành công
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/flights/Delete')
          .send({ flightId: 1 });

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Flight deleted successfully');
        expect(mockExecute).toHaveBeenCalledTimes(1);
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu flightId', async () => {
        const response = await request(app)
          .post('/api/flights/Delete')
          .send({});

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing flight ID');
        expect(mockExecute).not.toHaveBeenCalled();
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi flight không tồn tại', async () => {
        // Mock execute không xóa được bản ghi nào
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 0 });
        });

        const response = await request(app)
          .post('/api/flights/Delete')
          .send({ flightId: 999 });

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Flight not found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi xóa database thất bại', async () => {
        // Mock execute trả về error (có thể do foreign key constraint)
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Cannot delete flight with existing bookings'), null);
        });

        const response = await request(app)
          .post('/api/flights/Delete')
          .send({ flightId: 1 });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error deleting flight');
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Invalid routes', () => {
    it('nên trả về 404 cho route không tồn tại', async () => {
      const response = await request(app).get('/api/flights/NonExistentRoute');

      // Kiểm tra response 404
      expect(response.status).toBe(404);
    });
  });
});
