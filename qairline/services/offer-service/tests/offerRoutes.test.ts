/// <reference types="jest" />
/**
 * Test tích hợp routes cho offer service
 * Bao phủ đầy đủ: happy path + validation errors + permission errors + not found errors + database errors
 */
import request from 'supertest';
import express from 'express';
import offerRoutes from '../src/routes/offerRoutes';

// Mock các dependencies
jest.mock('../src/database/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  }
}));

jest.mock('../src/services/EmailService', () => ({
  sendEmail: jest.fn()
}));

import connection from '../src/database/database';
import { sendEmail } from '../src/services/EmailService';

const app = express();
app.use(express.json());
app.use('/api/offers', offerRoutes);

describe('Offer Routes Integration Tests', () => {
  let mockQuery: jest.Mock;
  let mockSendEmail: jest.Mock;

  beforeEach(() => {
    // Reset tất cả mocks trước mỗi test
    jest.clearAllMocks();
    mockQuery = connection.query as jest.Mock;
    mockSendEmail = sendEmail as jest.Mock;
  });

  describe('GET /api/offers/GetAllOffers', () => {
    describe('Trường hợp thành công', () => {
      it('nên trả về tất cả offers thành công', async () => {
        // Mock dữ liệu offers từ database
        const mockOffers = [
          {
            PostID: 1,
            Title: 'Summer Sale',
            Content: 'Giảm giá 50% tất cả chuyến bay',
            PostDate: '2024-12-01'
          },
          {
            PostID: 2,
            Title: 'New Route',
            Content: 'Mở đường bay mới Hà Nội - Đà Lạt',
            PostDate: '2024-12-05'
          }
        ];

        // Mock query trả về danh sách offers
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, mockOffers);
        });

        const response = await request(app).get('/api/offers/GetAllOffers');

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toEqual(mockOffers);
        expect(response.body.length).toBe(2);
        expect(mockQuery).toHaveBeenCalledTimes(1);
      });
    });

    describe('Kết quả rỗng', () => {
      it('nên trả về 404 khi không có offer nào', async () => {
        // Mock query trả về mảng rỗng
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app).get('/api/offers/GetAllOffers');

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('No offers found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi truy vấn database thất bại', async () => {
        // Mock query trả về error
        mockQuery.mockImplementation((sql: any, callback: any) => {
          callback(new Error('Database connection lost'), null);
        });

        const response = await request(app).get('/api/offers/GetAllOffers');

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('POST /api/offers/CreateOffer', () => {
    describe('Trường hợp thành công', () => {
      it('nên tạo offer mới và gửi email thành công', async () => {
        const newOffer = {
          title: 'Flash Sale',
          content: 'Giảm 70% trong 24h',
          userID: 1
        };

        // Mock kiểm tra admin role - user là admin
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'Admin' }]);
        });

        // Mock insert offer thành công
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 10 });
        });

        // Mock lấy danh sách emails users
        mockQuery.mockImplementationOnce((sql: any, callback: any) => {
          callback(null, [
            { Email: 'user1@example.com' },
            { Email: 'user2@example.com' }
          ]);
        });

        // Mock sendEmail thành công
        mockSendEmail.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send(newOffer);

        // Kiểm tra response thành công
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Offer created successfully and notifications sent');
        expect(response.body.timestamp).toBeDefined();
        expect(mockQuery).toHaveBeenCalledTimes(3); // check admin + insert + get emails
        expect(mockSendEmail).toHaveBeenCalledTimes(2); // gửi cho 2 users
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu title', async () => {
        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            content: 'Some content',
            userID: 1
          });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
        expect(mockQuery).not.toHaveBeenCalled();
      });

      it('nên trả về 400 khi thiếu content', async () => {
        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            title: 'Some title',
            userID: 1
          });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });

      it('nên trả về 400 khi thiếu userID', async () => {
        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            title: 'Some title',
            content: 'Some content'
          });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });
    });

    describe('Lỗi permission', () => {
      it('nên trả về 403 khi user không phải admin', async () => {
        // Mock kiểm tra role - user không phải admin
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'customer' }]);
        });

        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            title: 'Test',
            content: 'Test content',
            userID: 5
          });

        // Kiểm tra response 403
        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/permission denied/i);
      });

      it('nên trả về 403 khi userID không tồn tại', async () => {
        // Mock kiểm tra role - không tìm thấy user
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            title: 'Test',
            content: 'Test content',
            userID: 999
          });

        // Kiểm tra response 403
        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/permission denied/i);
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi kiểm tra role thất bại', async () => {
        // Mock query check role trả về error
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Database error'), null);
        });

        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            title: 'Test',
            content: 'Test content',
            userID: 1
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error checking user role');
      });

      it('nên trả về 500 khi insert offer thất bại', async () => {
        // Mock check admin OK
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'Admin' }]);
        });

        // Mock insert trả về error
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Insert failed'), null);
        });

        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            title: 'Test',
            content: 'Test content',
            userID: 1
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to create Offer');
      });

      it('nên trả về 500 khi lấy emails thất bại', async () => {
        // Mock check admin OK
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'Admin' }]);
        });

        // Mock insert OK
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { insertId: 10 });
        });

        // Mock get emails trả về error
        mockQuery.mockImplementationOnce((sql: any, callback: any) => {
          callback(new Error('Cannot fetch emails'), null);
        });

        const response = await request(app)
          .post('/api/offers/CreateOffer')
          .send({
            title: 'Test',
            content: 'Test content',
            userID: 1
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Failed to fetch user emails');
      });
    });
  });

  describe('POST /api/offers/DeleteOffer', () => {
    describe('Trường hợp thành công', () => {
      it('nên xóa offer thành công', async () => {
        // Mock check admin - user là admin
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'Admin' }]);
        });

        // Mock check post tồn tại
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ PostID: 5 }]);
        });

        // Mock delete thành công
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, { affectedRows: 1 });
        });

        const response = await request(app)
          .post('/api/offers/DeleteOffer')
          .send({
            postID: 5,
            UserID: 1
          });

        // Kiểm tra response thành công
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Offer deleted successfully');
        expect(mockQuery).toHaveBeenCalledTimes(3);
      });
    });

    describe('Lỗi validation', () => {
      it('nên trả về 400 khi thiếu postID', async () => {
        const response = await request(app)
          .post('/api/offers/DeleteOffer')
          .send({ UserID: 1 });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
        expect(mockQuery).not.toHaveBeenCalled();
      });

      it('nên trả về 400 khi thiếu UserID', async () => {
        const response = await request(app)
          .post('/api/offers/DeleteOffer')
          .send({ postID: 5 });

        // Kiểm tra response 400
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/missing required fields/i);
      });
    });

    describe('Lỗi permission', () => {
      it('nên trả về 403 khi user không phải admin', async () => {
        // Mock check role - không phải admin
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'customer' }]);
        });

        const response = await request(app)
          .post('/api/offers/DeleteOffer')
          .send({
            postID: 5,
            UserID: 2
          });

        // Kiểm tra response 403
        expect(response.status).toBe(403);
        expect(response.body.message).toMatch(/permission denied/i);
      });
    });

    describe('Lỗi không tìm thấy', () => {
      it('nên trả về 404 khi offer không tồn tại', async () => {
        // Mock check admin OK
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'Admin' }]);
        });

        // Mock check post - không tìm thấy
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, []);
        });

        const response = await request(app)
          .post('/api/offers/DeleteOffer')
          .send({
            postID: 999,
            UserID: 1
          });

        // Kiểm tra response 404
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Post not found');
      });
    });

    describe('Lỗi database', () => {
      it('nên trả về 500 khi kiểm tra admin thất bại', async () => {
        // Mock check admin trả về error
        mockQuery.mockImplementation((sql: any, params: any, callback: any) => {
          callback(new Error('Database error'), null);
        });

        const response = await request(app)
          .post('/api/offers/DeleteOffer')
          .send({
            postID: 5,
            UserID: 1
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Error checking user role');
      });

      it('nên trả về 500 khi xóa database thất bại', async () => {
        // Mock check admin OK
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ Role: 'Admin' }]);
        });

        // Mock check post OK
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(null, [{ PostID: 5 }]);
        });

        // Mock delete trả về error
        mockQuery.mockImplementationOnce((sql: any, params: any, callback: any) => {
          callback(new Error('Delete failed'), null);
        });

        const response = await request(app)
          .post('/api/offers/DeleteOffer')
          .send({
            postID: 5,
            UserID: 1
          });

        // Kiểm tra response 500
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
      });
    });
  });

  describe('Invalid routes', () => {
    it('nên trả về 404 cho route không tồn tại', async () => {
      const response = await request(app).get('/api/offers/InvalidRoute');

      // Kiểm tra response 404
      expect(response.status).toBe(404);
    });
  });
});
