import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

// Auth routes
router.post('/signin', userController.signIn);
router.post('/signup', userController.signUp);

// User management routes
router.get('/', userController.getAllUsers);
router.delete('/', userController.deleteUser);

export default router;