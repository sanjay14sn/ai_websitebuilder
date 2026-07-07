import Analytics from '../models/Analytics.js';
import Website from '../models/Website.js';

// @desc    Get website analytics
// @route   GET /api/analytics
// @access  Private
export const getAnalytics = async (req, res) => {
  const { websiteId } = req.query;

  try {
    let query = {};
    
    // If user is not admin, restrict to their websites
    if (req.user.role !== 'admin') {
      const myWebsites = await Website.find({ userId: req.user.id }).select('_id');
      const ids = myWebsites.map((w) => w._id);
      query = { websiteId: { $in: ids } };
    }

    if (websiteId && websiteId !== 'ALL') {
      query.websiteId = websiteId;
    }

    const records = await Analytics.find(query);

    // Generate last 7 days dates for chart data
    const chartData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dateRecords = records.filter((r) => r.date === dateStr);
      const views = dateRecords.reduce((sum, r) => sum + (r.views || 0), 0);
      const visitors = dateRecords.reduce((sum, r) => sum + (r.visitors || 0), 0);
      
      chartData.push({
        date: dateStr,
        views,
        visitors,
      });
    }

    const totalViews = records.reduce((sum, r) => sum + (r.views || 0), 0);
    const totalVisitors = records.reduce((sum, r) => sum + (r.visitors || 0), 0);

    const aggregate = {
      totalViews,
      totalVisitors,
      chartData,
      isMock: false,
    };

    res.status(200).json({ success: true, data: aggregate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record page view or interaction event (called by worker or preview frame)
// @route   POST /api/analytics/record
// @access  Public (so preview/worker can log events without authentication)
export const recordEvent = async (req, res) => {
  const { slug, eventType, details } = req.body;

  try {
    const website = await Website.findOne({ slug });
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Find or create analytics document for today
    let analytic = await Analytics.findOne({ websiteId: website._id, date: todayStr });
    
    if (!analytic) {
      analytic = new Analytics({
        websiteId: website._id,
        date: todayStr,
        views: 0,
        visitors: 0,
        events: [],
      });
    }

    if (eventType === 'view') {
      analytic.views += 1;
      // Simple visitor mock increment
      if (Math.random() > 0.4) {
        analytic.visitors += 1;
      }
    } else {
      analytic.events.push({
        eventType,
        details,
        timestamp: new Date(),
      });
    }

    await analytic.save();
    res.status(200).json({ success: true, message: 'Event logged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getAnalyticsModule = getAnalytics;
export const recordEventModule = recordEvent;
