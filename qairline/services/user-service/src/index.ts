import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import { UserController } from './controllers/UserController';

dotenv.config();

const app = express();
const userController = new UserController();

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes (theo cấu trúc backend cũ)
app.post('/api/auth/signin', userController.signIn.bind(userController));
app.post('/api/auth/signup', userController.signUp.bind(userController));

// User management routes (theo cấu trúc backend cũ)
app.get('/api/User/GetAllUser', userController.getAllUsers.bind(userController));
app.post('/api/User/DeleteUser', userController.deleteUser.bind(userController));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Healthz check for kubernetes/docker
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`User service is running on port ${PORT}`);
});
