import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { ensureGripLogoAsset } from './services/sitePostProcessor.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Ensure GRIP badge logo is available for generated sites
ensureGripLogoAsset();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Serve static uploaded files (crucial for local mock Cloudflare R2 uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/posters', express.static(path.join(__dirname, '..', 'public', 'posters')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root Healthcheck and Local Subdomain Router Route
app.get('/', async (req, res) => {
  const { subdomain } = req.query;
  if (subdomain) {
    try {
      const Website = (await import('./models/Website.js')).default;
      const website = await Website.findOne({ slug: subdomain.toLowerCase() });
      if (website && website.status === 'PUBLISHED' && website.generatedHtml) {
        const fullPage = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>${website.companyName || 'Business Website'}</title>
              <style>
                ${website.generatedCss || ''}
              </style>
            </head>
            <body>
              ${website.generatedHtml}
            </body>
          </html>
        `;
        res.setHeader('Content-Type', 'text/html');
        return res.send(fullPage);
      }
    } catch (err) {
      console.error('Error serving subdomain page locally:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'AI Website Builder REST API is running successfully.',
    environment: process.env.NODE_ENV || 'development',
    time: new Date(),
  });
});

// Custom Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler caught error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  Backend listening on port: ${PORT}`);
  console.log(`  Local static uploads served at: http://localhost:${PORT}/uploads/`);
  console.log(`===================================================`);
});

export default app;
