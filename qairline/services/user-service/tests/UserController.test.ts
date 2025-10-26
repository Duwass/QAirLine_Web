import type { Request, Response } from 'express';
import { UserController } from '../src/controllers/UserController';
import connection from '../src/database/database';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

jest.mock('../src/database/database', () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

// Mock các dependencies
jest.mock('../src/database/database', () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

describe('UserController', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    userController = new UserController();
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    const mockUser = {
      UserID: 1,
      Email: 'test@test.com',
      Password: 'hashedPassword',
      Username: 'testuser',
      Name: 'Test User',
      Role: 'user'
    };

    it('should return 401 for invalid email', () => {
      mockRequest.body = {
        email: 'test@test.com',
        password: 'password'
      };
      
      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, []);
      });

      userController.signIn(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password'
      });
    });

    it('should return 401 for invalid password', () => {
      mockRequest.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, [mockUser]);
      });

      (bcrypt.compare as jest.Mock).mockImplementation((password: string, hash: string, callback: Function) => {
        callback(null, false);
      });

      userController.signIn(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password'
      });
    });

    it('should return token for valid credentials', () => {
      mockRequest.body = {
        email: 'test@test.com',
        password: 'password123'
      };

      const mockToken = 'mock.jwt.token';

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, [mockUser]);
      });

      (bcrypt.compare as jest.Mock).mockImplementation((password: string, hash: string, callback: Function) => {
        callback(null, true);
      });

      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      userController.signIn(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Sign in successful',
        token: mockToken
      });
    });

    it('should handle database error', () => {
      mockRequest.body = {
        email: 'test@test.com',
        password: 'password'
      };

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(new Error('Database error'), null);
      });

      userController.signIn(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error querying database'
      });
    });
  });

  describe('signUp', () => {
    const mockUserData = {
      name: 'Test User',
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      role: 'user'
    };

    it('should create new user successfully', () => {
      mockRequest.body = mockUserData;
      const mockToken = 'mock.jwt.token';

      (connection.execute as jest.Mock)
        .mockImplementationOnce((query: string, params: any[], callback: Function) => {
          callback(null, []); // No existing user
        })
        .mockImplementationOnce((query: string, params: any[], callback: Function) => {
          callback(null, { insertId: 1 }); // Insert successful
        });

      (bcrypt.hash as jest.Mock).mockImplementation((password: string, salt: number, callback: Function) => {
        callback(null, 'hashedPassword');
      });

      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      userController.signUp(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Sign up successful',
        token: mockToken
      });
    });

    it('should return 400 for existing user', () => {
      mockRequest.body = mockUserData;

      (connection.execute as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, [{ id: 1 }]); // Existing user found
      });

      userController.signUp(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Username or Email already exists'
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', () => {
      const mockUsers = [
        { UserID: 1, Name: 'Test User' }
      ];

      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(null, mockUsers);
      });

      userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should return 404 when no users found', () => {
      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(null, []);
      });

      userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No users found'
      });
    });

    it('should handle database error', () => {
      (connection.query as jest.Mock).mockImplementation((query: string, callback: Function) => {
        callback(new Error('Database error'), null);
      });

      userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
        error: 'Database error'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', () => {
      mockRequest.body = { UserID: 1 };

      (connection.query as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 1 });
      });

      userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User deleted successfully'
      });
    });

    it('should return 404 when user not found', () => {
      mockRequest.body = { UserID: 999 };

      (connection.query as jest.Mock).mockImplementation((query: string, params: any[], callback: Function) => {
        callback(null, { affectedRows: 0 });
      });

      userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should return 400 when UserID is missing', () => {
      mockRequest.body = {};

      userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Missing required field: userID'
      });
    });
  });
});