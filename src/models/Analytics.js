import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventType: { type: String, required: true }, // e.g., 'click_contact', 'form_submission'
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

const analyticsSchema = new mongoose.Schema(
  {
    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Website',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    visitors: {
      type: Number,
      default: 0,
    },
    events: {
      type: [eventSchema],
      default: [],
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for aggregate queries
analyticsSchema.index({ websiteId: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
