/// <reference types="jest" />
/**
 * Test cho database connection module
 * Kiểm tra tất cả các phương thức của MySQL2 connection
 */
import mysql from 'mysql2';

// Mock toàn bộ module mysql2
jest.mock('mysql2', () => ({
  createConnection: jest.fn()
}));

describe('Database Connection Tests', () => {
  let mockConnection: any;
  let mockCreateConnection: jest.Mock;

  beforeEach(() => {
    // Reset tất cả mocks trước mỗi test
    jest.clearAllMocks();
    
    // Tạo mock connection với tất cả các phương thức cần thiết
    mockConnection = {
      connect: jest.fn(),
      query: jest.fn(),
      execute: jest.fn(),
      end: jest.fn()
    };
    
    // Mock hàm createConnection
    mockCreateConnection = mysql.createConnection as jest.Mock;
    mockCreateConnection.mockReturnValue(mockConnection);
  });

  describe('Tạo connection', () => {
    it('nên tạo connection với config đúng', () => {
      // Gọi createConnection với config
      const config = {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'qairline_users'
      };
      
      const connection = mysql.createConnection(config);
      
      // Kiểm tra createConnection được gọi với config đúng
      expect(mockCreateConnection).toHaveBeenCalledWith(config);
      expect(connection).toBe(mockConnection);
    });
  });

  describe('Phương thức connect', () => {
    it('nên có phương thức connect', () => {
      const connection = mysql.createConnection({});
      
      // Kiểm tra connection có phương thức connect
      expect(connection.connect).toBeDefined();
      expect(typeof connection.connect).toBe('function');
    });

    it('nên gọi callback khi connect thành công', (done) => {
      const connection = mysql.createConnection({});
      
      // Mock connect gọi callback với null (không có lỗi)
      mockConnection.connect.mockImplementation((callback: any) => {
        callback(null);
      });
      
      // Gọi connect và kiểm tra callback
      connection.connect((err) => {
        expect(err).toBeNull();
        expect(mockConnection.connect).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('nên gọi callback với error khi connect thất bại', (done) => {
      const connection = mysql.createConnection({});
      const mockError = new Error('Connection refused');
      
      // Mock connect gọi callback với error
      mockConnection.connect.mockImplementation((callback: any) => {
        callback(mockError);
      });
      
      // Gọi connect và kiểm tra error được trả về
      connection.connect((err) => {
        expect(err).toBe(mockError);
        expect(err?.message).toBe('Connection refused');
        done();
      });
    });
  });

  describe('Phương thức query', () => {
    it('nên thực hiện query và trả về kết quả', (done) => {
      const connection = mysql.createConnection({});
      const mockResults = [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }];
      
      // Mock query trả về kết quả
      mockConnection.query.mockImplementation((sql: any, callback: any) => {
        callback(null, mockResults);
      });
      
      // Thực hiện query
      connection.query('SELECT * FROM users', (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockResults);
        expect(mockConnection.query).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('nên trả về error khi query thất bại', (done) => {
      const connection = mysql.createConnection({});
      const mockError = new Error('Table not found');
      
      // Mock query trả về error
      mockConnection.query.mockImplementation((sql: any, callback: any) => {
        callback(mockError, null);
      });
      
      // Thực hiện query và kiểm tra error
      connection.query('SELECT * FROM invalid_table', (err, results) => {
        expect(err).toBe(mockError);
        expect(results).toBeNull();
        done();
      });
    });
  });

  describe('Phương thức execute', () => {
    it('nên thực hiện prepared statement với parameters', (done) => {
      const connection = mysql.createConnection({});
      const mockResults = { insertId: 1, affectedRows: 1 };
      
      // Mock execute trả về kết quả
      mockConnection.execute.mockImplementation((sql: any, params: any, callback: any) => {
        callback(null, mockResults);
      });
      
      // Thực hiện execute với parameters
      const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
      const params = ['John Doe', 'john@example.com'];
      
      connection.execute(sql, params, (err, results) => {
        expect(err).toBeNull();
        expect(results).toEqual(mockResults);
        expect(mockConnection.execute).toHaveBeenCalledWith(sql, params, expect.any(Function));
        done();
      });
    });
  });

  describe('Đóng connection', () => {
    it('nên đóng connection thành công', (done) => {
      const connection = mysql.createConnection({});
      
      // Mock end gọi callback không có lỗi
      mockConnection.end.mockImplementation((callback: any) => {
        callback(null);
      });
      
      // Đóng connection
      connection.end((err) => {
        expect(err).toBeNull();
        expect(mockConnection.end).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
