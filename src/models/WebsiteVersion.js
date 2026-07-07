import mongoose from 'mongoose';

const websiteVersionSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    layoutJson: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup
websiteVersionSchema.index({ websiteId: 1, versionNumber: -1 });

const WebsiteVersion = mongoose.model('WebsiteVersion', websiteVersionSchema);
export default WebsiteVersion;
