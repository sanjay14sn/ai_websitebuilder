import mongoose from 'mongoose';

const websiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Owner/Representative Name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company Name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: [true, 'Business Category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone Number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Contact Email is required'],
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    services: {
      type: [String],
      default: [],
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    logo: {
      type: String,
      default: '',
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    generatedHtml: {
      type: String,
      default: '',
    },
    generatedCss: {
      type: String,
      default: '',
    },
    webUrl: {
      type: String,
      default: '',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    chapter: {
      type: String,
      default: '',
    },
    zone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'UNDER_REVIEW', 'GENERATED', 'PUBLISHED', 'DEACTIVATED'],
      default: 'DRAFT',
    },
  },
  {
    timestamps: true,
  }
);

// Automatically generate slug from companyName if not set
websiteSchema.pre('validate', function (next) {
  if (this.companyName && !this.slug) {
    this.slug = this.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

const Website = mongoose.model('Website', websiteSchema);
export default Website;
