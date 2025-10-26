/// <reference types="jest" />
/**
 * Test tích hợp routes cho user service
 * Bao phủ đầy đủ: authentication, validation errors, not found errors, database errors
 */
import request from 'supertest';
import express from 'express';
import userRoutes from '../src/routes/userRoutes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock các dependencies
jest.mock('../src/database/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    execute: jest.fn(),
  }
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

import connection from '../src/database/database';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes Integration Tests', () => {
  let mockQuery: jest.Mock;
  let mockExecute: jest.Mock;
  let mockBcryptHash: jest.Mock;
  let mockBcryptCompare: jest.Mock;
  let mockJwtSign: jest.Mock;

  beforeEach(() => {
    // Reset tất cả mocks trước mỗi test
    jest.clearAllMocks();
    mockQuery = connection.query as jest.Mock;
    mockExecute = connection.execute as jest.Mock;
    mockBcryptHash = bcrypt.hash as jest.Mock;
    mockBcryptCompare = bcrypt.compare as jest.Mock;
    mockJwtSign = jwt.sign as jest.Mock;
  });

  describe('POST /api/users/signin', () => {
    describe('Trường hợp thành công', () => {
      it('nên đăng nhập thành công với credentials đúng', async () => {
        // Mock user từ database
        const mockUser = {
          UserID: 1,
          Email: 'user@example.com',
          Username: 'testuser',
          Name: 'Test User',
          Password: 'hashedPassword123',
          Role: 'customer'
        };

        // Mock execute tìm thấy user
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [mockUser]);
        });

        // Mock bcrypt compare trả về true (password khớp)
        mockBcryptCompare.mockImplementation((password: any, hash: any, callback: any) => {
          callback(null, true);
        });

        // Mock jwt sign trả về token
        mockJwtSign.mockReturnValue('mock.jwt.token');

        const response = await request(app)
          .post('/api/users/signin')
          .send({
            email: 'user@example.com',
            password: 'correctPassword'
          });

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Sign in successful');
        expect(response.body.token).toBe('mock.jwt.token');
        expect(mockExecute).toHaveBeenCalledTimes(1);
        expect(mockBcryptCompare).toHaveBeenCalledWith('correctPassword', 'hashedPassword123', expect.any(Function));
        expect(mockJwtSign).toHaveBeenCalledWith(
          expect.objectContaining({
            userid: 1,
            email: 'user@example.com',
            username: 'testuser'
          }),
          'secret_key',
          { expiresIn: '1h' }
        );
      });
    });

    describe('Lỗi authentication', () => {
      it('nên trả về 401 khi email không tồn tại', async () => {
        // Mock execute không tìm thấy user
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app)
          .post('/api/users/signin')
          .send({
            email: 'notfound@example.com',
            password: 'anyPassword'
          });

        // Kiểm tra response 401
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid email or password');
        expect(mockBcryptCompare).not.toHaveBeenCalled();
      });

      it('nên trả về 401 khi password sai', async () => {
        const mockUser = {
          UserID: 1,
          Email: 'user@example.com',
          Password: 'hashedPassword123'
        };

        // Mock execute tìm thấy user
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [mockUser]);
        });

        // Mock bcrypt compare trả về false (password không khớp)
        mockBcryptCompare.mockImplementation((password: any, hash: any, callback: any) => {
          callback(null, false);
        });

        const response = await request(app)
          .post('/api/users/signin')
          .send({
            email: 'user@example.com',
            password: 'wrongPassword'
          });

        // Kiểm tra response 401
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid email or password');
        expect(mockJwtSign).not.toHaveBeenCalled();
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi query database thất bại', async () => {
        // Mock execute trả về error
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Database connection lost'), null);
        });

        const response = await request(app)
          .post('/api/users/signin')
          .send({
            email: 'user@example.com',
            password: 'password'
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error querying database');
      });

      it('nên trả về 500 khi bcrypt compare thất bại', async () => {
        const mockUser = {
          UserID: 1,
          Email: 'user@example.com',
          Password: 'hashedPassword123'
        };

        // Mock execute tìm thấy user
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [mockUser]);
        });

        // Mock bcrypt compare trả về error
        mockBcryptCompare.mockImplementation((password: any, hash: any, callback: any) => {
          callback(new Error('Bcrypt error'), null);
        });

        const response = await request(app)
          .post('/api/users/signin')
          .send({
            email: 'user@example.com',
            password: 'password'
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error comparing passwords');
      });
    });
  });

  describe('POST /api/users/signup', () => {
    describe('Trường hợp thành công', () => {
      it('nên đăng ký user mới thành công', async () => {
        const newUser = {
          name: 'New User',
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'customer'
        };

        // Mock execute kiểm tra username/email chưa tồn tại
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        // Mock bcrypt hash password
        mockBcryptHash.mockImplementation((password: any, rounds: any, callback: any) => {
          callback(null, 'hashedPassword123');
        });

        // Mock execute insert user mới
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 5 });
        });

        // Mock jwt sign trả về token
        mockJwtSign.mockReturnValue('new.user.token');

        const response = await request(app)
          .post('/api/users/signup')
          .send(newUser);

        // Kiểm tra response thành công
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Sign up successful');
        expect(response.body.token).toBe('new.user.token');
        expect(mockExecute).toHaveBeenCalledTimes(2); // 1 lần check, 1 lần insert
        expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10, expect.any(Function));
        expect(mockJwtSign).toHaveBeenCalledWith(
          expect.objectContaining({
            userid: 5,
            email: newUser.email,
            username: newUser.username
          }),
          'secret_key',
          { expiresIn: '1h' }
        );
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi username đã tồn tại', async () => {
        // Mock execute tìm thấy user trùng username
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [{ UserID: 1, Username: 'existinguser' }]);
        });

        const response = await request(app)
          .post('/api/users/signup')
          .send({
            name: 'Test',
            username: 'existinguser',
            email: 'test@example.com',
            password: 'password',
            role: 'customer'
          });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username or Email already exists');
        expect(mockBcryptHash).not.toHaveBeenCalled();
      });

      it('nên trả về 400 khi email đã tồn tại', async () => {
        // Mock execute tìm thấy user trùng email
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [{ UserID: 1, Email: 'existing@example.com' }]);
        });

        const response = await request(app)
          .post('/api/users/signup')
          .send({
            name: 'Test',
            username: 'newuser',
            email: 'existing@example.com',
            password: 'password',
            role: 'customer'
          });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Username or Email already exists');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi kiểm tra username/email thất bại', async () => {
        // Mock execute trả về error
        mockExecute.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Database error'), null);
        });

        const response = await request(app)
          .post('/api/users/signup')
          .send({
            name: 'Test',
            username: 'newuser',
            email: 'test@example.com',
            password: 'password',
            role: 'customer'
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error querying database');
      });

      it('nên trả về 500 khi hash password thất bại', async () => {
        // Mock execute kiểm tra username/email OK
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        // Mock bcrypt hash trả về error
        mockBcryptHash.mockImplementation((password: any, rounds: any, callback: any) => {
          callback(new Error('Hash error'), null);
        });

        const response = await request(app)
          .post('/api/users/signup')
          .send({
            name: 'Test',
            username: 'newuser',
            email: 'test@example.com',
            password: 'password',
            role: 'customer'
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error hashing password');
      });

      it('nên trả về 500 khi insert user thất bại', async () => {
        // Mock execute kiểm tra username/email OK
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        // Mock bcrypt hash OK
        mockBcryptHash.mockImplementation((password: any, rounds: any, callback: any) => {
          callback(null, 'hashedPassword');
        });

        // Mock execute insert trả về error
        mockExecute.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Insert error'), null);
        });

        const response = await request(app)
          .post('/api/users/signup')
          .send({
            name: 'Test',
            username: 'newuser',
            email: 'test@example.com',
            password: 'password',
            role: 'customer'
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error inserting user into database');
      });
    });
  });

  describe('GET /api/users/', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về tất cả users thành công', async () => {
        // Mock danh sách users từ database
        const mockUsers = [
          {
            UserID: 1,
            Name: 'User 1',
            Username: 'user1',
            Email: 'user1@example.com',
            Role: 'customer'
          },
          {
            UserID: 2,
            Name: 'Admin User',
            Username: 'admin',
            Email: 'admin@example.com',
            Role: 'admin'
          }
        ];

        // Mock query trả về danh sách users
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, mockUsers);
        });

        const response = await request(app).get('/api/users/');

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockUsers);
        expect(response.body.length).toBe(2);
        expect(mockQuery).toHaveBeenCalledTimes(1);
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi không có user nào', async () => {
        // Mock query trả về mảng rỗng
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app).get('/api/users/');

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No users found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi query database thất bại', async () => {
        // Mock query trả về error
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(new Error('Connection timeout'), null);
        });

        const response = await request(app).get('/api/users/');

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('DELETE /api/users/', () => {
    describe('Trường hợp thành công', () => {
      it('nên xóa user thành công', async () => {
        // Mock query xóa thành công
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .delete('/api/users/')
          .send({ UserID: 5 });

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User deleted successfully');
        expect(mockQuery).toHaveBeenCalledWith(
          'DELETE FROM Users WHERE UserID = ?',
          [5],
          expect.any(Function)
        );
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu UserID', async () => {
        const response = await request(app)
          .delete('/api/users/')
          .send({});

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing required field: userID');
        expect(mockQuery).not.toHaveBeenCalled();
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi user không tồn tại', async () => {
        // Mock query không xóa được bản ghi nào
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 0 });
        });

        const response = await request(app)
          .delete('/api/users/')
          .send({ UserID: 999 });

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('User not found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi xóa database thất bại', async () => {
        // Mock query trả về error (có thể do foreign key constraint)
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Cannot delete user with existing bookings'), null);
        });

        const response = await request(app)
          .delete('/api/users/')
          .send({ UserID: 1 });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Invalid routes', () => {
    it('nên trả về 404 cho route không tồn tại', async () => {
      const response = await request(app).get('/api/users/InvalidRoute');

      // Kiểm tra response 404
      expect(response.status).toBe(404);
    });
  });
});
