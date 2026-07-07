import multer from 'multer';
import Media from '../models/Media.js';
import { uploadMediaService } from '../services/cloudinary.js';
import { getPublicBaseUrl } from '../utils/publicUrl.js';

// Setup multer in-memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit size to 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are supported'), false);
    }
  },
});

// @desc    Upload media file
// @route   POST /api/media/upload
// @access  Private
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to upload media' });
    }

    // Upload using service
    const uploadResult = await uploadMediaService(req.file);

    // Ensure returned URL uses the running server port (not stale 5001 defaults)
    let publicUrl = uploadResult.url;
    if (publicUrl.includes('localhost:5001')) {
      publicUrl = publicUrl.replace('http://localhost:5001', getPublicBaseUrl());
    }

    // Save record to DB
    const media = await Media.create({
      url: publicUrl,
      key: uploadResult.key,
      filename: uploadResult.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: uploadResult.url.includes('cloudinary') ? 'Uploaded to Cloudinary' : (uploadResult.mock ? 'Uploaded to local fallback server' : 'Uploaded to Cloudflare R2'),
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload media file for public guest visitors (uses Cloudinary)
// @route   POST /api/media/upload-public
// @access  Public
export const uploadMediaPublic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // Upload using service (triggers Cloudinary directly)
    const uploadResult = await uploadMediaService(req.file);

    let publicUrl = uploadResult.url;
    if (publicUrl.includes('localhost:5001')) {
      publicUrl = publicUrl.replace('http://localhost:5001', getPublicBaseUrl());
    }

    // Save record to DB
    const media = await Media.create({
      url: publicUrl,
      key: uploadResult.key,
      filename: uploadResult.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: uploadResult.url.includes('cloudinary') ? 'Uploaded to Cloudinary' : (uploadResult.mock ? 'Uploaded to local fallback server' : 'Uploaded to Cloudflare R2'),
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
