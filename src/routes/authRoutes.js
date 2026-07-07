import express from 'express';
import { register, login, getMe, gripAdminSession, gripAdminLogin } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// router.post('/register', register); // Disabled for internal tool
router.post('/login', login);
router.post('/grip-admin-login', gripAdminLogin);
router.post('/grip-admin-session', gripAdminSession);
router.get('/me', protect, getMe);

export default router;
