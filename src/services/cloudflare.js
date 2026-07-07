import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import Settings from '../models/Settings.js';
import { getLocalUploadsUrl, getPublicBaseUrl } from '../utils/publicUrl.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local in-memory mock KV store for testing without real credentials
const mockKV = new Map();

// Helper to load settings from DB
const getCfSettings = async () => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create empty settings
      settings = await Settings.create({});
    }
    return settings;
  } catch (error) {
    console.error('Error fetching Cloudflare settings from database:', error.message);
    return null;
  }
};

/**
 * Write website JSON payload to Cloudflare KV
 * URL: PUT https://api.cloudflare.com/client/v4/accounts/:account_id/storage/kv/namespaces/:namespace_id/values/:key
 */
export const writeToKV = async (key, value) => {
  const settings = await getCfSettings();
  
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || settings?.cloudflareAccountId;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || settings?.cloudflareApiToken;
  const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID || settings?.cloudflareKvNamespaceId;

  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  if (!accountId || !apiToken || !kvNamespaceId) {
    console.warn(`[Cloudflare KV Mock] Credentials missing. Saving key "${key}" to local memory store.`);
    mockKV.set(key, serialized);
    return { success: true, mock: true };
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values/${key}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: serialized,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudflare KV HTTP ${response.status}: ${errText}`);
    }

    console.log(`[Cloudflare KV] Successfully published website JSON to key "${key}"`);
    return { success: true, mock: false };
  } catch (error) {
    console.error(`[Cloudflare KV Error] Failed publishing for key "${key}":`, error.message);
    // Fallback to local memory so dashboard still functions
    mockKV.set(key, serialized);
    return { success: true, mock: true, error: error.message };
  }
};

/**
 * Get value from Cloudflare KV
 */
export const getFromKV = async (key) => {
  const settings = await getCfSettings();

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || settings?.cloudflareAccountId;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || settings?.cloudflareApiToken;
  const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID || settings?.cloudflareKvNamespaceId;

  if (!accountId || !apiToken || !kvNamespaceId) {
    return mockKV.get(key) || null;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values/${key}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (response.status === 404) {
      return mockKV.get(key) || null;
    }

    if (!response.ok) {
      throw new Error(`Cloudflare KV HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`[Cloudflare KV Error] Failed fetching key "${key}":`, error.message);
    return mockKV.get(key) || null;
  }
};

/**
 * Delete value from Cloudflare KV
 */
export const deleteFromKV = async (key) => {
  const settings = await getCfSettings();

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || settings?.cloudflareAccountId;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || settings?.cloudflareApiToken;
  const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID || settings?.cloudflareKvNamespaceId;

  mockKV.delete(key);

  if (!accountId || !apiToken || !kvNamespaceId) {
    return { success: true, mock: true };
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values/${key}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare KV HTTP ${response.status}`);
    }

    return { success: true, mock: false };
  } catch (error) {
    console.error(`[Cloudflare KV Error] Failed deleting key "${key}":`, error.message);
    return { success: true, mock: true, error: error.message };
  }
};

/**
 * Upload image/file to Cloudflare R2
 */
export const uploadToR2 = async (file) => {
  const settings = await getCfSettings();

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || settings?.cloudflareAccountId;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || settings?.cloudflareR2BucketName;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || settings?.cloudflareR2AccessKeyId;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || settings?.cloudflareR2SecretAccessKey;
  const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || settings?.cloudflareR2PublicUrl || `${getPublicBaseUrl()}/uploads`;

  const fileKey = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
    console.warn('[Cloudflare R2 Mock] Credentials missing. Saving file to local static directory.');
    
    // Ensure local public/uploads directory exists
    const localUploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }

    const localFilePath = path.join(localUploadsDir, fileKey);
    fs.writeFileSync(localFilePath, file.buffer);

    return {
      url: getLocalUploadsUrl(fileKey),
      key: fileKey,
      filename: file.originalname,
      mock: true
    };
  }

  try {
    // S3 client configured for Cloudflare R2
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    // Build URL (r2PublicUrl can be customized, e.g. https://pub-xyz.r2.dev/fileKey or custom domain)
    const formattedUrl = r2PublicUrl.endsWith('/')
      ? `${r2PublicUrl}${fileKey}`
      : `${r2PublicUrl}/${fileKey}`;

    return {
      url: formattedUrl,
      key: fileKey,
      filename: file.originalname,
      mock: false,
    };
  } catch (error) {
    console.error('[Cloudflare R2 Error] Failed file upload:', error.message);
    
    // Fallback to local file upload so upload flow still works
    const localUploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }

    const localFilePath = path.join(localUploadsDir, fileKey);
    fs.writeFileSync(localFilePath, file.buffer);

    return {
      url: getLocalUploadsUrl(fileKey),
      key: fileKey,
      filename: file.originalname,
      mock: true,
      error: error.message
    };
  }
};
