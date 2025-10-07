import express from 'express';
import reportController from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Créer un signalement (utilisateur authentifié)
router.post('/', authenticateToken, reportController.createReport);

// Routes admin uniquement
router.get('/', authenticateToken, reportController.getAllReports);
router.put('/:id/handle', authenticateToken, reportController.handleReport);
router.put('/:id/block', authenticateToken, reportController.blockReportedUser);

export default router;