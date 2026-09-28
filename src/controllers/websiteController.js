import Website from '../models/Website.js';
import WebsiteLayout from '../models/WebsiteLayout.js';
import WebsiteVersion from '../models/WebsiteVersion.js';
import { writeToKV, deleteFromKV } from '../services/cloudflare.js';
import { compileLayoutToSite } from '../services/layoutCompiler.js';
import { cleanBodyHtmlForSave, buildEditableSiteDocument, getStoredCss } from '../services/htmlEditor.js';
import { postProcessGeneratedSite, extractBodyHtml, getSiteHeadAssets } from '../services/sitePostProcessor.js';
import { generateSiteCode, generateAiHelperProfile } from '../services/aiGenerator.js';
import nodemailer from 'nodemailer';

// Helper: generate copy and layout structures based on business details
const generateDefaultLayout = (website) => {
  const { companyName, category, location, description, services, logo, socialLinks, phoneNumber, email } = website;

  const desc = description || '';

  // Decide a default theme style based on category
  let theme = 'business';
  let primaryColor = '#E63946'; // red
  let secondaryColor = '#1e293b'; // slate

  const catLower = category.toLowerCase();
  if (catLower.includes('tech') || catLower.includes('software') || catLower.includes('digital')) {
    theme = 'modern';
  } else if (catLower.includes('design') || catLower.includes('art') || catLower.includes('photo')) {
    theme = 'creative';
  } else if (catLower.includes('law') || catLower.includes('consult') || catLower.includes('finance')) {
    theme = 'business';
  } else if (catLower.includes('cafe') || catLower.includes('food') || catLower.includes('restaurant')) {
    theme = 'minimal';
  }

  // Generate templates for sections
  const sections = [
    {
      id: 'sec-hero',
      type: 'hero',
      title: `Welcome to ${companyName}`,
      subtitle: desc.length > 80 ? desc.substring(0, 80) + '...' : desc,
      content: {
        backgroundImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        ctaText: 'Get in Touch',
        ctaLink: '#sec-contact'
      }
    },
    {
      id: 'sec-about',
      type: 'about',
      title: 'About Our Business',
      subtitle: `Serving clients in ${location}`,
      content: {
        bodyText: desc || `We are a leading provider of ${category} services in ${location}. Our commitment is to deliver high-quality solutions tailored to our customers' needs.`,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
      }
    },
    {
      id: 'sec-services',
      type: 'services',
      title: 'Our Services',
      subtitle: 'What we offer to our clients',
      content: {
        items: services && services.length > 0
          ? services.map((s, idx) => ({ id: `srv-${idx}`, title: s, description: `High-quality professional ${s} service tailored for you.` }))
          : [
            { id: 'srv-1', title: 'Consulting', description: 'Expert guidance to optimize your daily operations and maximize returns.' },
            { id: 'srv-2', title: 'Support', description: 'Dedicated assistance to solve issues and provide continuous improvements.' },
            { id: 'srv-3', title: 'Custom Solutions', description: 'Tailored implementations specifically designed for your unique requirements.' }
          ]
      }
    },
    {
      id: 'sec-gallery',
      type: 'gallery',
      title: 'Our Gallery',
      subtitle: 'Take a look at our recent work and projects',
      content: {
        images: website.galleryImages && website.galleryImages.length > 0
          ? website.galleryImages.map((img, idx) => ({ id: `img-${idx}`, url: img, caption: `Project ${idx + 1}` }))
          : [
            { id: 'img-1', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80', caption: 'Digital Workspace' },
            { id: 'img-2', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=500&q=80', caption: 'Team Collaboration' },
            { id: 'img-3', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=500&q=80', caption: 'Modern Design' }
          ]
      }
    },
    {
      id: 'sec-contact',
      type: 'contact',
      title: 'Contact Us',
      subtitle: 'Have questions? We would love to hear from you.',
      content: {
        email: email || 'contact@company.com',
        phone: phoneNumber || '+1 (555) 000-0000',
        address: location || '123 Business Rd, City',
        mapEmbed: ''
      }
    }
  ];

  return {
    theme,
    sections,
    themeSettings: {
      primaryColor,
      secondaryColor,
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      fontFamily: theme === 'modern' ? 'Outfit' : theme === 'creative' ? 'Poppins' : 'Inter'
    },
    seoSettings: {
      title: `${companyName} | Premium ${category} in ${location}`,
      description: desc.substring(0, 160),
      keywords: `${category}, ${companyName}, ${location}, services`
    }
  };
};

// @desc    Create new website
// @route   POST /api/websites
// @access  Public / Private
export const createWebsite = async (req, res) => {
  try {
    let userId = req.user?.id;

    // For public submissions, link the request to the first administrator
    if (!userId) {
      const User = (await import('../models/User.js')).default;
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        userId = admin._id;
      } else {
        return res.status(500).json({ success: false, message: 'Admin account not seeded yet. Cannot submit profile.' });
      }
    }

    const websiteData = {
      ...req.body,
      userId,
      status: 'DRAFT',
    };

    const website = await Website.create(websiteData);
    res.status(201).json({ success: true, data: website });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all websites
// @route   GET /api/websites
// @access  Private
export const getWebsites = async (req, res) => {
  try {
    // Admins can see all websites, regular users only see their own
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const websites = await Website.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: websites.length, data: websites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single website details (with layout)
// @route   GET /api/websites/:id
// @access  Private
export const getWebsiteById = async (req, res) => {
  try {
    const website = await Website.findById(req.id || req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    // Auth check
    if (req.user.role !== 'admin' && website.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const layout = await WebsiteLayout.findOne({ websiteId: website._id });

    res.status(200).json({
      success: true,
      data: {
        website,
        layout: layout || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update website details
// @route   PUT /api/websites/:id
// @access  Private
export const updateWebsite = async (req, res) => {
  try {
    let website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    // Auth check
    if (req.user.role !== 'admin' && website.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Extract layout edits if sent along
    const { layout, ...websiteDetails } = req.body;

    if (websiteDetails.generatedHtml) {
      // Extract updated logo from the editor HTML if edited
      const imgTags = websiteDetails.generatedHtml.match(/<img[^>]*>/gi) || [];
      for (const tag of imgTags) {
        if (/class=["'][^"']*(company-logo|logo)[^"']*["']/i.test(tag)) {
          const srcMatch = tag.match(/src=["']([^"']*)["']/i);
          if (srcMatch && srcMatch[1]) {
            const newLogoUrl = srcMatch[1].trim();
            if (newLogoUrl && !newLogoUrl.includes('logo.png') && newLogoUrl !== website.logo) {
              console.log(`📸 Extracted updated logo from editor HTML: ${newLogoUrl}`);
              websiteDetails.logo = newLogoUrl;
              break;
            }
          }
        }
      }

      const cleaned = cleanBodyHtmlForSave(websiteDetails.generatedHtml);
      const bodyOnly = extractBodyHtml(cleaned);
      const existingCss = websiteDetails.generatedCss ?? website.generatedCss ?? '';
      const processed = postProcessGeneratedSite(bodyOnly, existingCss, {
        ...website.toObject(),
        ...websiteDetails,
      });
      websiteDetails.generatedHtml = processed.html;
      websiteDetails.generatedCss = processed.css;
    }

    // Update website details (including generatedHtml / generatedCss when saving from editor)
    website = await Website.findByIdAndUpdate(req.params.id, websiteDetails, {
      new: true,
      runValidators: true,
    });

    // Update layout if provided — only recompile when layout is explicitly sent without direct HTML save
    let updatedLayout = null;
    if (layout && !websiteDetails.generatedHtml) {
      updatedLayout = await WebsiteLayout.findOneAndUpdate(
        { websiteId: website._id },
        { ...layout },
        { new: true, upsert: true }
      );

      // Recompile generated HTML/CSS from editable layout JSON
      const compiled = compileLayoutToSite(website, updatedLayout.toObject ? updatedLayout.toObject() : updatedLayout);
      website.generatedHtml = compiled.html;
      website.generatedCss = compiled.css;
      if (website.status === 'DRAFT') {
        website.status = 'GENERATED';
      }
      await website.save();
    } else {
      updatedLayout = await WebsiteLayout.findOne({ websiteId: website._id });
    }

    res.status(200).json({
      success: true,
      data: {
        website,
        layout: updatedLayout,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete website
// @route   DELETE /api/websites/:id
// @access  Private
export const deleteWebsite = async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    // Auth check
    if (req.user.role !== 'admin' && website.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Clean up KV store if published
    if (website.status === 'PUBLISHED') {
      await deleteFromKV(website.slug);
    }

    // Remove from DB
    await WebsiteLayout.deleteOne({ websiteId: website._id });
    await WebsiteVersion.deleteMany({ websiteId: website._id });
    await website.deleteOne();

    res.status(200).json({ success: true, message: 'Website and assets deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate website layout structures and static code using Gemini
// @route   POST /api/websites/:id/generate
// @access  Private (Admin only)
export const generateWebsite = async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    console.log(`🚀 Starting AI website generation for ID: ${website._id} (${website.companyName})`);

    const { html, css } = await generateSiteCode(website);
    website.generatedHtml = html;
    website.generatedCss = css;
    website.status = 'GENERATED';
    await website.save();

    const layoutPayload = generateDefaultLayout(website);
    const layout = await WebsiteLayout.findOneAndUpdate(
      { websiteId: website._id },
      layoutPayload,
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Website layout and static code successfully generated',
      data: {
        website,
        layout,
      },
    });
  } catch (error) {
    console.error('❌ AI website generation failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Editable preview of generated HTML (same as live preview, with inline edit mode)
// @route   GET /api/websites/:id/edit-preview
// @access  Private
export const getWebsiteEditPreview = async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    if (req.user.role !== 'admin' && website.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!website.generatedHtml) {
      return res.status(400).json({
        success: false,
        message: 'No generated website found. Please generate the website first.',
      });
    }

    const document = buildEditableSiteDocument(website);
    const baseCss = getStoredCss(website);
    return res.status(200).json({ success: true, data: { document, baseCss } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Render layout JSON to HTML/CSS without saving (live editor preview)
// @route   POST /api/websites/:id/render-layout
// @access  Private
export const renderLayoutPreview = async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    if (req.user.role !== 'admin' && website.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { layout, editMode } = req.body;
    if (!layout) {
      return res.status(400).json({ success: false, message: 'Layout payload is required' });
    }

    const compiled = compileLayoutToSite(website, layout, { editMode: Boolean(editMode) });
    return res.status(200).json({ success: true, data: compiled });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Preview website raw compiled HTML
// @route   GET /api/websites/:id/preview
// @access  Public
export const previewWebsite = async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).send('Website not found');
    }

    if (!website.generatedHtml) {
      return res.status(404).send('No generated website code found. Please generate the website first.');
    }

    const processed = postProcessGeneratedSite(website.generatedHtml, website.generatedCss || '', website);
    const bodyHtml = (processed.html || '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();

    const fullPage = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${website.companyName || 'Business Website'}</title>
          ${getSiteHeadAssets()}
          <style>
            ${processed.css || ''}
          </style>
        </head>
        <body>
          ${bodyHtml}
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(fullPage);
  } catch (error) {
    res.status(500).send('Error loading preview: ' + error.message);
  }
};

// @desc    Publish website JSON and HTML to Cloudflare KV
// @route   POST /api/websites/:id/publish
// @access  Private (Admin only)
export const publishWebsite = async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    if (!website.generatedHtml) {
      return res.status(400).json({
        success: false,
        message: 'No generated HTML code found. Please run the Generator first.',
      });
    }

    // SUBDOMAIN: companyname-chaptername-zonename (or fallback if empty)
    let subdomain = website.slug || '';
    if (website.chapter) {
      const cleanChapter = website.chapter.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (cleanChapter) subdomain += `-${cleanChapter}`;
    }
    if (website.zone) {
      const cleanZone = website.zone.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (cleanZone) subdomain += `-${cleanZone}`;
    }
    // Clean and ensure no double hyphens or leading/trailing hyphens
    subdomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Fallback if somehow empty or too short
    if (!subdomain || subdomain.length < 3) {
      subdomain = `${website.slug || 'site'}-${website._id.toString().slice(-4)}`;
    }
    console.log(`🌐 Publishing site to Cloudflare KV under subdomain: ${subdomain}`);

    const processed = postProcessGeneratedSite(website.generatedHtml, website.generatedCss || '', website);
    const bodyHtml = extractBodyHtml(processed.html);

    // Compile the static HTML page wrapper
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${website.companyName || 'Business Website'}</title>
    ${getSiteHeadAssets()}
    <style>
        ${processed.css || ''}
    </style>
</head>
<body>
    ${bodyHtml}
</body>
</html>`;

    // Push raw HTML payload to Cloudflare KV using prefix key 'sites:subdomain'
    const kvKey = `sites:${subdomain}`;
    const kvResult = await writeToKV(kvKey, fullHtml);

    // Save version history in MongoDB
    const latestVersion = await WebsiteVersion.findOne({ websiteId: website._id })
      .sort({ versionNumber: -1 });
    const nextVerNum = latestVersion ? latestVersion.versionNumber + 1 : 1;

    await WebsiteVersion.create({
      websiteId: website._id,
      versionNumber: nextVerNum,
      layoutJson: {
        html: website.generatedHtml,
        css: website.generatedCss,
        subdomain,
        publishedAt: new Date()
      },
      publishedBy: req.user.id,
    });

    const webUrl = `https://${subdomain}.gripforumglobal.com`;
    website.webUrl = webUrl;
    website.status = 'PUBLISHED';
    await website.save();

    res.status(200).json({
      success: true,
      message: 'Website successfully published to Cloudflare KV!',
      web_url: webUrl,
      poster_url: website.posterUrl || '',
      mock: kvResult.mock,
      data: website,
    });
  } catch (error) {
    console.error('❌ Publishing website failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit public contact form and trigger email sending to business email
// @route   POST /api/websites/:id/contact
// @access  Public
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Find website to get the target business email
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    const targetEmail = website.email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Business contact email not configured for this website' });
    }

    console.log(`✉️ Sending contact form email to: ${targetEmail}`);

    // Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER || 'gripbusinessforum@gmail.com',
        pass: process.env.MAIL_PASSWORD || 'skffcrirzizrhjyo'
      }
    });

    const mailOptions = {
      from: `"GRIP Website Builder" <${process.env.MAIL_USER || 'gripbusinessforum@gmail.com'}>`,
      to: targetEmail,
      subject: `New Lead Inquiry - ${website.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #e63946; border-bottom: 2px solid #e63946; padding-bottom: 10px; margin-top: 0;">New Lead Generated!</h2>
          <p style="font-size: 16px; color: #374151;">You have received a new message through your webpage contact form:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563;"><a href="mailto:${email}">${email || 'N/A'}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Phone:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563;"><a href="tel:${phone}">${phone || 'N/A'}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Message:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563; white-space: pre-wrap;">${message || 'No message provided.'}</td>
            </tr>
          </table>
          <p style="margin-top: 25px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            Powered by GRIP Business Forum Webpage Builder
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Contact form email successfully sent to: ${targetEmail}`);

    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('❌ Error sending contact form email:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send message: ' + error.message });
  }
};

// @desc    Deactivate a published website (removes it from Cloudflare KV and updates status)
// @route   POST /api/websites/:id/deactivate
// @access  Private (Admin only)
export const deactivateWebsite = async (req, res) => {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    // Determine subdomain mapped to this website
    let subdomain = website.slug || '';
    if (website.chapter) {
      const cleanChapter = website.chapter.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (cleanChapter) subdomain += `-${cleanChapter}`;
    }
    if (website.zone) {
      const cleanZone = website.zone.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (cleanZone) subdomain += `-${cleanZone}`;
    }
    subdomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    if (!subdomain || subdomain.length < 3) {
      subdomain = `${website.slug || 'site'}-${website._id.toString().slice(-4)}`;
    }

    const kvKey = `sites:${subdomain}`;
    
    // Delete from Cloudflare KV
    console.log(`🚫 Deactivating site: Removing KV key ${kvKey}`);
    await deleteFromKV(kvKey);

    // Update status to DEACTIVATED
    website.status = 'DEACTIVATED';
    await website.save();

    res.status(200).json({
      success: true,
      message: 'Website successfully deactivated and taken offline.',
      data: website,
    });
  } catch (error) {
    console.error('❌ Deactivating website failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI Profile Helper to generate description and 6 core services based on profile inputs
// @route   POST /api/websites/ai-helper
// @access  Public
export const getAiHelperProfile = async (req, res) => {
  try {
    const { companyName, category, location } = req.body;
    if (!companyName || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Company Name, Category, and Location/Head Office are required to generate AI suggestions.'
      });
    }

    console.log(`🤖 AI Helper: Generating profile for Company: ${companyName}, Category: ${category}, Location: ${location}`);
    const suggestions = await generateAiHelperProfile(companyName, category, location);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('❌ AI Helper Profile generation failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public check for existing website by mobile number
// @route   GET /api/websites/public/check-mobile/:mobileNumber
// @access  Public
export const checkExistingByMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.params;
    if (!mobileNumber) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 8) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number' });
    }

    // Match using the last 10 digits to be immune to different country code formats (+91, 91, 0, etc.)
    const searchTarget = cleanMobile.slice(-10);

    const website = await Website.findOne({
      phoneNumber: { $regex: searchTarget }
    });

    if (website) {
      return res.status(200).json({
        success: true,
        exists: true,
        data: website
      });
    }

    res.status(200).json({
      success: true,
      exists: false
    });
  } catch (error) {
    console.error('❌ Check existing by mobile failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

