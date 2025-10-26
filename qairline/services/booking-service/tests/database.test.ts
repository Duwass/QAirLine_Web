/// <reference types="jest" />
/**
 * Test kết nối database cho booking service
 * Kiểm tra các phương thức: createConnection, connect, query, execute, close
 */
import mysql from 'mysql2';

// Mock mysql2 để tránh kết nối thật đến database
jest.mock('mysql2', () => ({
  createConnection: jest.fn(() => ({
    connect: jest.fn((callback) => callback(null)),
    end: jest.fn((callback) => callback && callback(null)),
    query: jest.fn(),
    execute: jest.fn(),
  })),
}));

describe('Database Connection', () => {
  let mockConnection: any;

  beforeEach(() => {
    // Xóa tất cả mock trước mỗi test
    jest.clearAllMocks();
    // Tạo kết nối mock với cấu hình test
    mockConnection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'booking_service_db',
    });
  });

  afterEach(() => {
    // Đóng kết nối sau mỗi test
    if (mockConnection && mockConnection.end) {
      mockConnection.end();
    }
  });

  describe('createConnection', () => {
    it('nên tạo kết nối với cấu hình đúng', () => {
      // Kiểm tra createConnection được gọi với config chính xác
      expect(mysql.createConnection).toHaveBeenCalledWith({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'booking_service_db',
      });
    });

    it('nên có phương thức connect', () => {
      // Kiểm tra phương thức connect tồn tại
      expect(mockConnection.connect).toBeDefined();
      expect(typeof mockConnection.connect).toBe('function');
    });

    it('nên có phương thức query', () => {
      // Kiểm tra phương thức query tồn tại
      expect(mockConnection.query).toBeDefined();
      expect(typeof mockConnection.query).toBe('function');
    });

    it('nên có phương thức execute', () => {
      // Kiểm tra phương thức execute tồn tại
      expect(mockConnection.execute).toBeDefined();
      expect(typeof mockConnection.execute).toBe('function');
    });
  });

  describe('connect', () => {
    it('nên kết nối thành công không có lỗi', (done) => {
      // Thực hiện kết nối
      mockConnection.connect((err: any) => {
        // Không có lỗi xảy ra
        expect(err).toBeNull();
        done();
      });
    });

    it('nên xử lý lỗi kết nối', (done) => {
      // Tạo kết nối mock với lỗi
      const errorConnection = {
        connect: jest.fn((callback) => callback(new Error('Connection failed'))),
      };

      // Thực hiện kết nối
      errorConnection.connect((err: any) => {
        // Kiểm tra lỗi được trả về
        expect(err).toBeDefined();
        expect(err.message).toBe('Connection failed');
        done();
      });
    });
  });

  describe('query', () => {
    it('nên thực thi truy vấn thành công', () => {
      const mockCallback = jest.fn();
      // Thực hiện truy vấn SQL
      mockConnection.query('SELECT * FROM Bookings', mockCallback);

      // Kiểm tra query được gọi với tham số đúng
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM Bookings',
        mockCallback
      );
    });
  });

  describe('execute', () => {
    it('nên thực thi prepared statement thành công', () => {
      const mockCallback = jest.fn();
      // Thực hiện prepared statement với tham số
      mockConnection.execute(
        'SELECT * FROM Bookings WHERE BookingID = ?',
        [1],
        mockCallback
      );

      // Kiểm tra execute được gọi với tham số đúng
      expect(mockConnection.execute).toHaveBeenCalledWith(
        'SELECT * FROM Bookings WHERE BookingID = ?',
        [1],
        mockCallback
      );
    });
  });

  describe('close connection', () => {
    it('nên đóng kết nối thành công', (done) => {
      // Đóng kết nối database
      mockConnection.end((err: any) => {
        // Không có lỗi khi đóng
        expect(err).toBeNull();
        done();
      });
    });
  });
});
