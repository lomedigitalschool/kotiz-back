// Routes des utilisateurs
import express from 'express';
const router = express.Router();
import UserController from '../controllers/userController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/multerConfig.js';

router.get('/', authenticate, isAdmin, UserController.getAll);
router.get('/stats', authenticate, isAdmin, UserController.getStats);
router.get('/dashboard', authenticate, UserController.getDashboard);
router.get('/chart-data', authenticate, isAdmin, UserController.getChartData);

// Endpoint spécial pour AdminJS (utilise la session AdminJS)
router.get('/admin-stats', UserController.getAdminStats);
router.get('/admin-chart-data', UserController.getAdminChartData);

// Endpoint spécial pour l'admin local (génère token JWT)
router.post('/admin-login', UserController.adminLogin);
router.get('/:id', authenticate, UserController.getOne);
router.put('/:id', authenticate, UserController.update);
router.delete('/:id', authenticate, isAdmin, UserController.remove);

// Upload d'avatar
router.post('/avatar', authenticate, uploadAvatar, UserController.uploadAvatar);

export default router;
