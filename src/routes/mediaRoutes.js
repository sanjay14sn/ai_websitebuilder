import express from 'express';
import { upload, uploadMedia, uploadMediaPublic } from '../controllers/mediaController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload', protect, upload.single('image'), uploadMedia);
router.post('/upload-public', upload.single('image'), uploadMediaPublic);

export default router;
