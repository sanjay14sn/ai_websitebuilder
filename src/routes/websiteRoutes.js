import express from 'express';
import {
  createWebsite,
  getWebsites,
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
  generateWebsite,
  renderLayoutPreview,
  getWebsiteEditPreview,
  publishWebsite,
  previewWebsite,
  submitContactForm,
  deactivateWebsite,
  getAiHelperProfile,
  checkExistingByMobile,
} from '../controllers/websiteController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Allow public submissions for creating website profiles
router.post('/', createWebsite);

// Public website preview endpoint
router.get('/:id/preview', previewWebsite);

// Public contact form submission endpoint
router.post('/:id/contact', submitContactForm);

// Public AI Helper suggestions generator
router.post('/ai-helper', getAiHelperProfile);

// Public check for duplicate submissions by mobile number
router.get('/public/check-mobile/:mobileNumber', checkExistingByMobile);

// Protect all other routes (getting, updating, publishing)
router.use(protect);

router.get('/', getWebsites);

router.get('/:id/edit-preview', getWebsiteEditPreview);

router.post('/:id/render-layout', renderLayoutPreview);

router.route('/:id')
  .get(getWebsiteById)
  .put(updateWebsite)
  .delete(deleteWebsite);

// Admin-only endpoints for generating layouts and publishing to Cloudflare KV
router.post('/:id/generate', requireAdmin, generateWebsite);
router.post('/:id/publish', requireAdmin, publishWebsite);
router.post('/:id/deactivate', requireAdmin, deactivateWebsite);

export default router;
