// Tests cho Offer Service
import { Request, Response } from 'express';
import { OfferController } from '../src/controllers/OfferController';
import connection from '../src/database/database';
import * as EmailService from '../src/services/EmailService';

// Mock database và email service
jest.mock('../src/database/database');
jest.mock('../src/services/EmailService');

const mockedConnection = connection as jest.Mocked<typeof connection>;

describe('OfferController', () => {
  let offerController: OfferController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    offerController = new OfferController();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getAllOffers', () => {
    it('should return all offers successfully', (done) => {
      const mockOffers = [
        { PostID: 1, Title: 'Offer 1', Content: 'Content 1', PostDate: '2024-01-01' },
        { PostID: 2, Title: 'Offer 2', Content: 'Content 2', PostDate: '2024-01-02' },
      ];
      mockRequest = {};

      (mockedConnection.query as jest.Mock).mockImplementation((sql: string, cb: (err: any, results: any) => void) => {
        cb(null, mockOffers);
      });

      offerController.getAllOffers(mockRequest as Request, mockResponse as Response);

      expect(mockedConnection.query).toHaveBeenCalledWith(
        'SELECT PostID, Title, Content, PostDate FROM Offers',
        expect.any(Function)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockOffers);
      done();
    });

    it('should return 404 when no offers found', (done) => {
      mockRequest = {};
      (mockedConnection.query as jest.Mock).mockImplementation((sql: string, cb: (err: any, results: any) => void) => {
        cb(null, []);
      });

      offerController.getAllOffers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No offers found' });
      done();
    });

    it('should handle database errors', (done) => {
      mockRequest = {};
      (mockedConnection.query as jest.Mock).mockImplementation((sql: string, cb: (err: any, results: any) => void) => {
        cb(new Error('DB Error'), null);
      });

      offerController.getAllOffers(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
        error: 'DB Error',
      });
      done();
    });
  });

  describe('createOffer', () => {
    it('should create offer and send emails successfully', (done) => {
      mockRequest = {
        body: { title: 'New Offer', content: 'Offer content', userID: 1 },
      };
      const mockUsers = [{ Email: 'user1@example.com' }, { Email: 'user2@example.com' }];
      (EmailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      (mockedConnection.query as jest.Mock)
        .mockImplementationOnce((sql, params, cb) => cb(null, [{ Role: 'Admin' }])) // Check admin
        .mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 1 })) // Insert offer
        .mockImplementationOnce((sql, cb) => cb(null, mockUsers)); // Get users

      offerController.createOffer(mockRequest as Request, mockResponse as Response);

      setTimeout(() => {
        expect(mockedConnection.query).toHaveBeenCalledTimes(3);
        expect(EmailService.sendEmail).toHaveBeenCalledTimes(2);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Offer created successfully and notifications sent' })
        );
        done();
      }, 100);
    });

    it('should return 400 when required fields are missing', () => {
        mockRequest = { body: { title: 'New Offer' } };
        offerController.createOffer(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Missing required fields: title, content, or UserID' });
    });

    it('should return 403 when user is not admin', (done) => {
        mockRequest = { body: { title: 'New Offer', content: 'Offer content', userID: 1 } };
        (mockedConnection.query as jest.Mock).mockImplementation((sql, params, cb) => cb(null, [{ Role: 'Customer' }]));
        offerController.createOffer(mockRequest as Request, mockResponse as Response);
        
        setTimeout(() => {
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission denied: User does not exist or is not an admin' });
            done();
        }, 100);
    });
    
    it('should handle database error when checking admin', (done) => {
        mockRequest = { body: { title: 'New Offer', content: 'Offer content', userID: 1 } };
        (mockedConnection.query as jest.Mock).mockImplementation((sql, params, cb) => cb(new Error('DB Error'), null));
        offerController.createOffer(mockRequest as Request, mockResponse as Response);
        setTimeout(() => {
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error checking user role', error: 'DB Error' });
            done();
        }, 100);
    });

    it('should handle error when inserting offer', (done) => {
        mockRequest = { body: { title: 'New Offer', content: 'Offer content', userID: 1 } };
        (mockedConnection.query as jest.Mock)
            .mockImplementationOnce((sql, params, cb) => cb(null, [{ Role: 'Admin' }]))
            .mockImplementationOnce((sql, params, cb) => cb(new Error('Insert Error'), null));
        offerController.createOffer(mockRequest as Request, mockResponse as Response);
        setTimeout(() => {
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to create Offer' });
            done();
        }, 100);
    });
  });

  describe('deleteOffer', () => {
    it('should delete offer successfully', (done) => {
        mockRequest = { body: { postID: 1, UserID: 1 } };
        (mockedConnection.query as jest.Mock)
            .mockImplementationOnce((sql, params, cb) => cb(null, [{ Role: 'Admin' }])) // Check admin
            .mockImplementationOnce((sql, params, cb) => cb(null, [{ PostID: 1 }])) // Check post exists
            .mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 })); // Delete
        offerController.deleteOffer(mockRequest as Request, mockResponse as Response);
        setTimeout(() => {
            expect(mockedConnection.query).toHaveBeenCalledTimes(3);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Offer deleted successfully' });
            done();
        }, 100);
    });

    it('should return 400 when required fields are missing', () => {
        mockRequest = { body: { postID: 1 } };
        offerController.deleteOffer(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Missing required fields: postID or UserID' });
    });

    it('should return 403 when user is not admin', (done) => {
        mockRequest = { body: { postID: 1, UserID: 1 } };
        (mockedConnection.query as jest.Mock).mockImplementation((sql, params, cb) => cb(null, [{ Role: 'Customer' }]));
        offerController.deleteOffer(mockRequest as Request, mockResponse as Response);
        setTimeout(() => {
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Permission denied: User is not an admin' });
            done();
        }, 100);
    });

    it('should return 404 when post not found', (done) => {
        mockRequest = { body: { postID: 999, UserID: 1 } };
        (mockedConnection.query as jest.Mock)
            .mockImplementationOnce((sql, params, cb) => cb(null, [{ Role: 'Admin' }]))
            .mockImplementationOnce((sql, params, cb) => cb(null, [])); // Post not found
        offerController.deleteOffer(mockRequest as Request, mockResponse as Response);
        setTimeout(() => {
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Post not found' });
            done();
        }, 100);
    });

    it('should handle database error when deleting offer', (done) => {
        mockRequest = { body: { postID: 1, UserID: 1 } };
        (mockedConnection.query as jest.Mock)
            .mockImplementationOnce((sql, params, cb) => cb(null, [{ Role: 'Admin' }]))
            .mockImplementationOnce((sql, params, cb) => cb(null, [{ PostID: 1 }]))
            .mockImplementationOnce((sql, params, cb) => cb(new Error('Delete Error'), null));
        offerController.deleteOffer(mockRequest as Request, mockResponse as Response);
        setTimeout(() => {
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal Server Error', error: 'Delete Error' });
            done();
        }, 100);
    });
  });
});
