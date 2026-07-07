import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    cloudflareAccountId: {
      type: String,
      default: '',
    },
    cloudflareApiToken: {
      type: String,
      default: '',
    },
    cloudflareKvNamespaceId: {
      type: String,
      default: '',
    },
    cloudflareR2BucketName: {
      type: String,
      default: '',
    },
    cloudflareR2AccessKeyId: {
      type: String,
      default: '',
    },
    cloudflareR2SecretAccessKey: {
      type: String,
      default: '',
    },
    cloudflareR2PublicUrl: {
      type: String,
      default: '', // Public custom domain or dev URL for R2 bucket
    },
    wildcardDomain: {
      type: String,
      default: 'domain.com', // e.g. companyname.domain.com
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
