import express from 'express';
const router = express.Router();
import notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

router.get('/', authenticate, notificationController.getAll);
router.put('/:id/read', authenticate, notificationController.markAsRead);

export default router;
