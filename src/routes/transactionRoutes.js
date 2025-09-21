import express from 'express';
const router = express.Router();
import userController from '../controllers/userController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

router.get('/', authenticate, isAdmin, userController.getAll); 
router.get('/:id', authenticate, userController.getOne);
router.put('/:id', authenticate, userController.update);
router.delete('/:id', authenticate, isAdmin, userController.remove);

export default router;
