import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['hero', 'about', 'services', 'gallery', 'contact'],
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

const websiteLayoutSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
      unique: true,
    },
    theme: {
      type: String,
      default: 'business',
    },
    sections: {
      type: [sectionSchema],
      default: [],
    },
    themeSettings: {
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#1e293b' },
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#0f172a' },
      fontFamily: { type: String, default: 'Inter' },
    },
    seoSettings: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const WebsiteLayout = mongoose.model('WebsiteLayout', websiteLayoutSchema);
export default WebsiteLayout;
