import { v2 as cloudinary } from 'cloudinary';
import { uploadToR2 } from './cloudflare.js';
import dotenv from 'dotenv';

dotenv.config();

const hasCloudinaryCredentials = 
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export const uploadMediaService = async (file, folder = 'ai-website-builder') => {
  if (!hasCloudinaryCredentials) {
    console.warn('[Cloudinary Service] Credentials missing. Falling back to R2/Local storage.');
    return uploadToR2(file);
  }

  return new Promise((resolve, reject) => {
    const fileKey = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const publicId = fileKey.includes('.') ? fileKey.substring(0, fileKey.lastIndexOf('.')) : fileKey;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]:', error.message);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          key: result.public_id,
          filename: file.originalname,
          mock: false
        });
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const uploadImageUrlToCloudinary = async (imageUrl, folder = 'ai-website-builder') => {
  if (!hasCloudinaryCredentials) {
    console.warn('[Cloudinary Service] Credentials missing. Cannot upload remote URL.');
    return imageUrl;
  }

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: 'image'
    });
    return result.secure_url;
  } catch (err) {
    console.error('[Cloudinary URL Upload Error]:', err.message);
    return imageUrl;
  }
};
