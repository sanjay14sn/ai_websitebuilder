import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPublicBaseUrl, getLocalUploadsUrl } from '../utils/publicUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRIP_LOGO_FILENAME = 'logo.png';
/** Default Cloudinary URL for GRIP Proud Associate badge (never use localhost in generated sites). */
export const DEFAULT_GRIP_LOGO_URL =
  'https://res.cloudinary.com/dexrm9ve9/image/upload/v1784109653/ai-website-builder/grip-proud-associate-logo.png';

export const GRIP_FIX_MARKER = '/* GRIP generated-site layout fixes */';
export const FONT_AWESOME_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';

export const FONT_AWESOME_LINK = `<link rel="stylesheet" href="${FONT_AWESOME_CDN}" crossorigin="anonymous" referrerpolicy="no-referrer" />`;

export function getSiteHeadAssets() {
  return `${FONT_AWESOME_LINK}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`;
}

export function ensureGripLogoAsset() {
  const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
  const dest = path.join(uploadsDir, GRIP_LOGO_FILENAME);

  if (fs.existsSync(dest)) return dest;

  const candidates = [
    path.join(__dirname, '..', '..', '..', 'ai-website-builder', 'frontend', 'public', GRIP_LOGO_FILENAME),
    path.join(__dirname, '..', '..', '..', 'frontend', 'public', GRIP_LOGO_FILENAME),
  ];

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const src of candidates) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      return dest;
    }
  }

  return null;
}

export function getGripLogoUrl() {
  const fromEnv = (process.env.GRIP_LOGO_URL || process.env.GRIP_LOGO_CLOUDINARY_URL || '').trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_GRIP_LOGO_URL;
}

const LAYOUT_FIX_CSS = `
${GRIP_FIX_MARKER}
*, *::before, *::after { box-sizing: border-box !important; }
html { scroll-behavior: smooth; }
body {
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;
  width: 100% !important;
  font-family: 'Inter', sans-serif !important;
  color: #212529 !important;
  background: #fff !important;
  line-height: 1.6 !important;
}
img, video, svg { max-width: 100% !important; height: auto; }
section, #header, #about, #services, #why-us, #connect-form, #contact {
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}
h1, h2, h3, h4, h5, h6 { font-family: 'Poppins', sans-serif !important; }

#header {
  display: block !important;
  padding: 20px 12px !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  width: 100% !important;
  background: #fff !important;
  box-sizing: border-box !important;
  overflow-x: hidden !important;
}
/* Mobile-first header: center on top, GRIP badges in a row below (never side overflow) */
#header .header-wrapper {
  display: grid !important;
  grid-template-columns: 64px 64px !important;
  justify-content: center !important;
  justify-items: center !important;
  align-items: center !important;
  column-gap: 24px !important;
  row-gap: 14px !important;
  padding: 8px !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}
#header .header-center,
#header > div:nth-child(2),
#header .header-wrapper > div:nth-child(2) {
  grid-column: 1 / -1 !important;
  width: 100% !important;
  max-width: 100% !important;
  text-align: center !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 10px !important;
  box-sizing: border-box !important;
  padding: 0 4px !important;
}
#header img[alt*="GRIP"],
#header img[alt*="Proud"],
#header .grip-badge,
#header .grip-badge img {
  width: 64px !important;
  height: 64px !important;
  max-width: 64px !important;
  max-height: 64px !important;
  object-fit: contain !important;
  flex-shrink: 0 !important;
  display: block !important;
  margin: 0 !important;
}
#header .company-logo,
#header .header-center img:not(.grip-badge) {
  width: 72px !important;
  height: 72px !important;
  max-width: 72px !important;
  max-height: 72px !important;
  border-radius: 50% !important;
  object-fit: cover !important;
  display: block !important;
  margin: 0 auto !important;
}
#header h1 {
  font-size: 26px !important;
  font-weight: 700 !important;
  margin: 0 !important;
  text-align: center !important;
  word-break: break-word !important;
  max-width: 100% !important;
}
#header h2 {
  font-size: 12px !important;
  font-weight: 600 !important;
  margin: 0 !important;
  text-align: center !important;
  text-transform: uppercase !important;
  letter-spacing: 0.4px !important;
  color: #6C757D !important;
  max-width: 100% !important;
  padding: 0 4px !important;
  line-height: 1.4 !important;
  word-break: break-word !important;
}
#header .contact-info,
#header p {
  font-size: 12px !important;
  margin: 0 !important;
  text-align: center !important;
  max-width: 100% !important;
  word-break: break-word !important;
  overflow-wrap: anywhere !important;
}
@media (min-width: 769px) {
  #header { padding: 24px 16px !important; }
  #header .header-wrapper {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 24px !important;
    padding: 16px !important;
    grid-template-columns: none !important;
  }
  #header .header-center {
    grid-column: auto !important;
    flex: 1 1 auto !important;
    width: auto !important;
  }
  #header img[alt*="GRIP"],
  #header img[alt*="Proud"],
  #header .grip-badge,
  #header .grip-badge img {
    width: 100px !important;
    height: 100px !important;
    max-width: 100px !important;
    max-height: 100px !important;
  }
  #header .company-logo,
  #header .header-center img:not(.grip-badge) {
    width: 80px !important;
    height: 80px !important;
    max-width: 80px !important;
    max-height: 80px !important;
  }
  #header h1 { font-size: clamp(28px, 4vw, 36px) !important; }
  #header h2 { font-size: clamp(13px, 2vw, 15px) !important; }
  #header .contact-info,
  #header p { font-size: 14px !important; }
}

#about { padding: 80px 20px !important; background: #fff !important; }
#about .about-grid,
#about > .container,
#about > div {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
  gap: 32px !important;
  align-items: center !important;
  max-width: 1100px !important;
  margin: 0 auto !important;
  width: 100% !important;
}
#about img { width: 100% !important; border-radius: 16px !important; object-fit: cover !important; }

#services { padding: 80px 20px !important; background: #fff !important; }
#services .services-grid,
#services > div > div:not(:first-child),
#services [class*="grid"] {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
  gap: 24px !important;
  max-width: 1100px !important;
  margin: 0 auto !important;
  width: 100% !important;
}
#services .service-card,
#services article,
#services [class*="card"] {
  background: #fff !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04) !important;
}
#services .service-card img,
#services article img {
  width: 100% !important;
  height: 200px !important;
  object-fit: cover !important;
  display: block !important;
}

#why-us,
section[id="why-us"] {
  padding: 80px 20px !important;
  background: #fff !important;
  text-align: center !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}
#why-us .section-header,
#why-us .section-label,
#why-us .pill-badge {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin-left: auto !important;
  margin-right: auto !important;
  margin-bottom: 40px !important;
  text-align: center !important;
  width: fit-content !important;
  max-width: 100% !important;
}
#why-us .container {
  max-width: 1100px !important;
  margin: 0 auto !important;
  width: 100% !important;
  padding: 0 12px !important;
}
#why-us .why-us-grid,
#why-us .why-grid,
#why-us [class*="why"][class*="grid"],
#why-us > div > div:not(.section-header):not(:first-child) {
  /* Mobile-first: ALWAYS stack — AI often uses flex-row which ignores grid-template-columns */
  display: flex !important;
  flex-direction: column !important;
  flex-wrap: nowrap !important;
  align-items: stretch !important;
  gap: 16px !important;
  max-width: 1100px !important;
  margin: 0 auto !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
#why-us .why-us-card,
#why-us .why-card,
#why-us [class*="why"][class*="card"],
#why-us [class*="card"] {
  background: #fff !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 16px !important;
  padding: 28px 18px !important;
  text-align: center !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  flex: 0 0 auto !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  box-shadow: none !important;
}
#why-us .why-us-card h3,
#why-us .why-us-card h4,
#why-us [class*="card"] h3,
#why-us [class*="card"] h4 {
  font-family: 'Poppins', sans-serif !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  margin: 0 0 10px !important;
  color: #212529 !important;
  text-align: center !important;
  width: 100% !important;
  word-break: normal !important;
  overflow-wrap: break-word !important;
  hyphens: none !important;
}
#why-us .why-us-card p,
#why-us [class*="card"] p {
  font-size: 14px !important;
  color: #6C757D !important;
  margin: 0 !important;
  text-align: center !important;
  width: 100% !important;
  line-height: 1.6 !important;
  word-break: normal !important;
  overflow-wrap: break-word !important;
}
@media (min-width: 640px) {
  #why-us .why-us-grid,
  #why-us .why-grid,
  #why-us [class*="why"][class*="grid"] {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    flex-direction: unset !important;
    gap: 20px !important;
  }
}
@media (min-width: 1024px) {
  #why-us .why-us-grid,
  #why-us .why-grid,
  #why-us [class*="why"][class*="grid"] {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  }
  #why-us .why-us-card h3,
  #why-us .why-us-card h4,
  #why-us [class*="card"] h3,
  #why-us [class*="card"] h4 {
    font-size: 20px !important;
  }
}
#why-us .why-us-card img,
#why-us .why-card img,
#why-us [class*="why"][class*="card"] img,
#why-us .company-logo {
  display: none !important;
}
#why-us .icon-wrapper,
#why-us .why-us-icon,
#why-us .why-us-icon-circle {
  width: 70px !important;
  height: 70px !important;
  min-width: 70px !important;
  min-height: 70px !important;
  max-width: 70px !important;
  max-height: 70px !important;
  margin: 0 auto 20px !important;
  border: 2px solid #E63946 !important;
  border-radius: 50% !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: 0 0 70px !important;
  overflow: visible !important;
  background: #fff !important;
  box-sizing: border-box !important;
  padding: 0 !important;
  line-height: 1 !important;
}
#why-us .icon-wrapper i,
#why-us .why-us-icon i,
#why-us .why-us-icon-circle i,
#why-us i[class*="fa"] {
  color: #E63946 !important;
  font-size: 28px !important;
  line-height: 1 !important;
  display: inline-block !important;
  width: 1em !important;
  height: 1em !important;
  max-width: none !important;
  max-height: none !important;
  flex-shrink: 0 !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
}

#connect-form,
section[id="connect-form"] {
  padding: 80px 20px !important;
  background: #fff !important;
  text-align: center !important;
  width: 100% !important;
}
#connect-form .connect-title,
#connect-form h2 {
  text-align: center !important;
  font-size: 36px !important;
  font-weight: 700 !important;
  margin-bottom: 10px !important;
}
#connect-form .connect-subtitle {
  text-align: center !important;
  font-size: 16px !important;
  color: #6C757D !important;
  margin-bottom: 40px !important;
}
#connect-form .form-container,
#connect-form form,
#connect-form .contact-form {
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  width: 100% !important;
  max-width: 700px !important;
  margin: 0 auto !important;
  padding: 40px !important;
  background: #fff !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 16px !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.02) !important;
  text-align: left !important;
  box-sizing: border-box !important;
}
#connect-form .form-container form,
#connect-form .form-container .contact-form {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
#connect-form .form-field,
.contact-form .form-field {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  width: 100% !important;
  margin-bottom: 4px !important;
}
#connect-form label,
.contact-form label {
  display: block !important;
  width: 100% !important;
  text-align: left !important;
  margin: 0 0 6px !important;
  font-weight: 600 !important;
  font-size: 14px !important;
}
#connect-form input:not([type="button"]):not([type="submit"]),
#connect-form textarea,
#connect-form select,
.contact-form input:not([type="button"]):not([type="submit"]),
.contact-form textarea,
.contact-form select {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  display: block !important;
  margin: 0 !important;
  padding: 12px 14px !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 8px !important;
  font: inherit !important;
  background: #fff !important;
}
#connect-form textarea,
.contact-form textarea { min-height: 150px !important; resize: vertical !important; }
#connect-form table,
.contact-form table { width: 100% !important; border: none !important; border-collapse: collapse !important; }
#connect-form tr,
.contact-form tr { display: flex !important; flex-direction: column !important; margin-bottom: 12px !important; }
#connect-form td,
.contact-form td { display: block !important; width: 100% !important; padding: 0 !important; border: none !important; }
#connect-form .captcha-row,
#connect-form [class*="captcha"],
.contact-form .captcha-row {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  align-items: stretch !important;
  width: 100% !important;
}
#connect-form .captcha-box,
#connect-form [id*="captcha-display"],
.contact-form .captcha-box {
  flex: 0 0 120px !important;
  min-height: 46px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #F3F4F6 !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 8px 0 0 8px !important;
  font-weight: 700 !important;
  padding: 12px !important;
}
#connect-form .captcha-row input,
.contact-form .captcha-row input {
  flex: 1 1 160px !important;
  min-width: 0 !important;
  border-radius: 0 !important;
}
#connect-form .captcha-row button,
#connect-form [id*="captcha-refresh"],
.contact-form .captcha-row button {
  flex: 0 0 auto !important;
  padding: 12px 20px !important;
  background: #fff !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 0 8px 8px 0 !important;
  cursor: pointer !important;
  font: inherit !important;
}
#connect-form button[type="submit"],
#connect-form input[type="submit"],
#connect-form .send-btn,
#connect-form .send-button,
.contact-form .send-button {
  width: 100% !important;
  margin-top: 8px !important;
  padding: 14px !important;
  background: #E63946 !important;
  color: #fff !important;
  border: none !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  font-size: 16px !important;
}
.map-container,
#connect-form .map-container,
#connect-form iframe {
  margin-top: 80px !important;
  margin-bottom: 20px !important;
}

#contact,
footer#contact {
  background: #F5F5F5 !important;
  padding: 60px 20px 24px !important;
  width: 100% !important;
}
#contact .contact-cards,
#contact .footer-grid,
#contact .contact-cards-container,
#contact > .container {
  display: block !important;
  max-width: 1100px !important;
  margin: 0 auto 24px !important;
  width: 100% !important;
  padding: 0 !important;
}
#contact .contact-cards,
.contact-cards {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
  gap: 20px !important;
  width: 100% !important;
}
#contact .contact-card,
.contact-card,
#contact .footer-card {
  background: #fff !important;
  border-radius: 16px !important;
  padding: 24px !important;
  text-align: center !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04) !important;
}
#contact .contact-card i,
.contact-card i {
  color: #E63946 !important;
  font-size: 24px !important;
  margin-bottom: 15px !important;
  display: block !important;
}
#contact .contact-card p,
.contact-card p {
  margin: 6px 0 !important;
  word-break: break-word !important;
}
#contact .contact-card strong,
.contact-card strong {
  display: block !important;
  font-weight: 700 !important;
}
#contact .footer-separator,
#contact hr {
  max-width: 1100px !important;
  margin: 24px auto !important;
  border: none !important;
  border-top: 1px solid #E5E7EB !important;
}
#contact .copyright,
#contact .footer-copyright,
#contact > p:last-child {
  text-align: center !important;
  padding: 20px 0 !important;
  max-width: 1100px !important;
  margin: 0 auto !important;
}
#contact .footer-copyright a,
#contact a {
  color: #E63946 !important;
  text-decoration: none !important;
}

.wa-btn, .phone-btn,
[class*="wa-btn"], [class*="phone-btn"],
.fixed-contact, .floating-buttons {
  display: none !important;
}

@media (max-width: 639px) {
  /* Final mobile kill-switch — must win over AI flex-row / 4-col grids */
  section, #header, #about, #services, #why-us, #connect-form, #contact {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
  #header {
    overflow-x: hidden !important;
    padding: 20px 12px !important;
  }
  #header .header-wrapper {
    display: grid !important;
    grid-template-columns: 64px 64px !important;
    justify-content: center !important;
    justify-items: center !important;
    column-gap: 20px !important;
    row-gap: 12px !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }
  #header .header-center {
    grid-column: 1 / -1 !important;
    width: 100% !important;
  }
  #header .grip-badge,
  #header img[alt*="GRIP"],
  #header img[alt*="Proud"] {
    width: 64px !important;
    height: 64px !important;
    max-width: 64px !important;
    max-height: 64px !important;
  }

  #why-us .why-us-grid,
  #why-us .why-grid,
  #why-us [class*="why"][class*="grid"],
  .why-us-grid,
  .why-grid {
    display: flex !important;
    flex-direction: column !important;
    flex-wrap: nowrap !important;
    align-items: stretch !important;
    grid-template-columns: none !important;
    gap: 16px !important;
    width: 100% !important;
  }
  #why-us .why-us-card,
  #why-us .why-card,
  .why-us-card {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 auto !important;
    min-width: 0 !important;
  }

  .about-grid,
  .services-grid,
  .contact-cards,
  .footer-grid {
    display: flex !important;
    flex-direction: column !important;
    grid-template-columns: none !important;
  }

  img, video, iframe {
    max-width: 100% !important;
    height: auto !important;
  }
  #about img, #services img {
    width: 100% !important;
  }
  #why-us .icon-wrapper,
  #why-us .why-us-icon,
  #why-us .why-us-icon-circle {
    width: 70px !important;
    height: 70px !important;
    min-width: 70px !important;
    min-height: 70px !important;
    max-width: 70px !important;
    max-height: 70px !important;
    flex: 0 0 70px !important;
  }

  #connect-form form,
  #connect-form .contact-form {
    padding: 24px 16px !important;
    width: 100% !important;
  }
  #connect-form .captcha-row,
  .contact-form .captcha-row {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  #connect-form .captcha-box,
  .contact-form .captcha-box {
    border-radius: 8px !important;
    width: 100% !important;
    flex: 1 1 auto !important;
  }
  #connect-form .captcha-row input,
  .contact-form .captcha-row input,
  #connect-form .captcha-row button,
  .contact-form .captcha-row button {
    border-radius: 8px !important;
    width: 100% !important;
  }
}
`;

function fixLocalhostUrls(html) {
  const base = getPublicBaseUrl();
  return html
    .replace(/https?:\/\/localhost:5001\//gi, `${base}/`)
    .replace(/https?:\/\/127\.0\.0\.1:5001\//gi, `${base}/`)
    .replace(/https?:\/\/localhost:5014\//gi, `${base}/`)
    .replace(/https?:\/\/127\.0\.0\.1:5014\//gi, `${base}/`)
    .replace(/https?:\/\/localhost:\d+\//gi, `${base}/`)
    .replace(/https?:\/\/127\.0\.0\.1:\d+\//gi, `${base}/`);
}

function fixGripLogoImages(html) {
  const logoUrl = getGripLogoUrl();
  let fixed = fixLocalhostUrls(html);

  // Replace any local/uploads logo.png references with Cloudinary (or configured) URL
  fixed = fixed.replace(
    /https?:\/\/[^"'>\s]+\/uploads\/logo\.png/gi,
    logoUrl
  );
  fixed = fixed.replace(
    /(["'])\/uploads\/logo\.png\1/gi,
    `$1${logoUrl}$1`
  );

  // Match only the GRIP badge images (using class name or exact alt text)
  fixed = fixed.replace(
    /<img([^>]*class=["'][^"']*grip-badge[^"']*["'][^>]*)>/gi,
    (tag) => {
      if (/src=/i.test(tag)) {
        return tag.replace(/src=["'][^"']*["']/i, `src="${logoUrl}"`);
      }
      return tag.replace('<img', `<img src="${logoUrl}"`);
    }
  );

  fixed = fixed.replace(
    /<img([^>]*alt=["']GRIP Proud Associate["'][^>]*)>/gi,
    (tag) => {
      if (/src=/i.test(tag)) {
        return tag.replace(/src=["'][^"']*["']/i, `src="${logoUrl}"`);
      }
      return tag.replace('<img', `<img src="${logoUrl}"`);
    }
  );

  return fixed;
}

function normalizeWhyUsSection(html) {
  if (!/id=["']why-us["']/i.test(html)) return html;

  const defaultIcons = [
    'fa-solid fa-handshake',
    'fa-solid fa-earth-americas',
    'fa-solid fa-sliders',
    'fa-solid fa-headset',
  ];

  return html.replace(
    /(<section[^>]*id=["']why-us["'][^>]*>)([\s\S]*?)(<\/section>)/i,
    (match, open, inner, close) => {
      const cardOpenRe = /<(div|article)([^>]*\b(?:why-us-card|why-card)\b[^>]*)>/gi;
      let result = '';
      let lastIndex = 0;
      let cardIndex = 0;
      let cardMatch;

      while ((cardMatch = cardOpenRe.exec(inner)) !== null) {
        const tag = cardMatch[1];
        const attrs = cardMatch[2];
        const start = cardMatch.index;
        const contentStart = cardOpenRe.lastIndex;

        result += inner.slice(lastIndex, start);

        // Walk forward with tag depth to find matching close tag
        let depth = 1;
        let i = contentStart;
        const openTag = new RegExp(`<${tag}\\b`, 'gi');
        const closeTag = new RegExp(`</${tag}>`, 'gi');

        while (i < inner.length && depth > 0) {
          openTag.lastIndex = i;
          closeTag.lastIndex = i;
          const nextOpen = openTag.exec(inner);
          const nextClose = closeTag.exec(inner);

          if (!nextClose) break;

          if (nextOpen && nextOpen.index < nextClose.index) {
            depth += 1;
            i = nextOpen.index + nextOpen[0].length;
          } else {
            depth -= 1;
            i = nextClose.index + nextClose[0].length;
            if (depth === 0) {
              let cardInner = inner.slice(contentStart, nextClose.index);
              const iconClass = defaultIcons[cardIndex % defaultIcons.length];
              cardIndex += 1;

              cardInner = cardInner.replace(/<img\b[^>]*>/gi, '');

              if (!/<i\b[^>]*class=["'][^"']*fa[^"']*["']/i.test(cardInner)) {
                cardInner = `\n<div class="icon-wrapper"><i class="${iconClass}"></i></div>${cardInner}`;
              } else if (!/icon-wrapper|why-us-icon|why-us-icon-circle/i.test(cardInner)) {
                cardInner = cardInner.replace(
                  /(<i\b[^>]*class=["'][^"']*fa[^"']*["'][^>]*>\s*<\/i>)/i,
                  '\n<div class="icon-wrapper">$1</div>'
                );
              }

              result += `<${tag}${attrs}>${cardInner}</${tag}>`;
              lastIndex = i;
            }
          }
        }

        cardOpenRe.lastIndex = lastIndex;
      }

      result += inner.slice(lastIndex);
      return `${open}${result}${close}`;
    }
  );
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractContactCardText(cardHtml = '') {
  const heading = (cardHtml.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i) || [])[1] || '';
  const paragraph = (cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '';
  const strip = (s) =>
    String(s)
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  return { heading: strip(heading), paragraph: strip(paragraph), raw: cardHtml };
}

/**
 * Contact cards order: Company → Address → Phone → Email.
 * Replaces any "Visit Website" / globe card with Address, placed before phone.
 */
function normalizeContactCards(html, website = {}) {
  if (!/<div[^>]*class=["'][^"']*contact-cards/i.test(html)) return html;

  return html.replace(
    /(<div[^>]*class=["'][^"']*contact-cards[^"']*["'][^>]*>)((?:\s*<div[^>]*class=["'][^"']*contact-card[^"']*["'][^>]*>[\s\S]*?<\/div>\s*)+)(<\/div>)/i,
    (match, open, inner, close) => {
      const cardRe = /<div[^>]*class=["'][^"']*contact-card[^"']*["'][^>]*>[\s\S]*?<\/div>/gi;
      const cards = [];
      let m;
      while ((m = cardRe.exec(inner)) !== null) {
        cards.push(extractContactCardText(m[0]));
      }
      if (cards.length === 0) return match;

      const byIcon = (re) => cards.find((c) => re.test(c.raw));
      const companyCard = byIcon(/fa-user/i);
      const phoneCard = byIcon(/fa-phone/i);
      const emailCard = byIcon(/fa-envelope/i);
      const addressCard = byIcon(/fa-map-marker|fa-location|fa-home/i);

      const companyName =
        website.companyName ||
        companyCard?.heading ||
        cards[0]?.heading ||
        'Company';
      const address =
        website.location ||
        addressCard?.heading ||
        (companyCard?.paragraph && !/^company$/i.test(companyCard.paragraph)
          ? companyCard.paragraph
          : '') ||
        'Address not provided';
      const phone = website.phoneNumber || phoneCard?.heading || '';
      const email = website.email || emailCard?.heading || '';

      const renderCard = (iconClass, title, subtitle) =>
        `<div class="contact-card"><i class="${iconClass}"></i><h4>${escapeHtml(title)}</h4><p>${escapeHtml(subtitle)}</p></div>`;

      const rebuilt = [
        renderCard('fas fa-user', companyName, 'Company'),
        renderCard('fas fa-map-marker-alt', address, 'Address'),
        renderCard('fas fa-phone-alt', phone || 'Phone', 'Call Us'),
        renderCard('fas fa-envelope', email || 'Email', 'Drop a Mail'),
      ].join('');

      return `${open}${rebuilt}${close}`;
    }
  );
}

function normalizeHtmlStructure(html, website = {}) {
  let fixed = html
    .replace(/\scontenteditable="[^"]*"/gi, '')
    .replace(/\sspellcheck="[^"]*"/gi, '')
    .replace(/\sdata-html-editable="[^"]*"/gi, '')
    .replace(/<div><br><\/div>/gi, '<br>');

  fixed = normalizeWhyUsSection(fixed);
  fixed = normalizeContactCards(fixed, website);

  if (/id=["']connect-form["']/i.test(fixed) && !/class=["'][^"']*form-field/i.test(fixed)) {
    fixed = fixed.replace(
      /(<form[^>]*>)([\s\S]*?)(<\/form>)/i,
      (match, formOpen, inner, formClose) => {
        if (/form-field/i.test(inner)) return match;
        const wrapped = inner.replace(
          /(<label[^>]*>[\s\S]*?<\/label>)\s*(<input[^>]*\/?>|<textarea[^>]*>[\s\S]*?<\/textarea>)/gi,
          '<div class="form-field">$1$2</div>'
        );
        return `${formOpen}${wrapped}${formClose}`;
      }
    );
  }

  return fixed;
}

function extractEmbeddedStyles(html = '') {
  const styles = [];
  const bodyHtml = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    styles.push(css.trim());
    return '';
  });
  return { bodyHtml: bodyHtml.trim(), embeddedStyles: styles };
}

function repairTruncatedCss(css = '') {
  if (!css) return '';

  let fixed = css.replace(/\0/g, '').trim();

  // 1. Remove markdown style backticks or headers if they leaked in
  fixed = fixed.replace(/^```css\s*/i, '');
  fixed = fixed.replace(/```\s*$/g, '');
  fixed = fixed.replace(/===+CSS===+/gi, '');

  // 2. Normalize whitespace
  fixed = fixed.replace(/\r\n/g, '\n');

  // 3. Remove half-written rules at the very end of the file
  fixed = fixed.replace(/[^}{;]+\s*{\s*$/g, '');

  // Remove incomplete trailing declarations or selectors
  let lines = fixed.split('\n');
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim();
    if (!lastLine) {
      lines.pop();
      continue;
    }
    // If the last line ends in a colon or ends with a property name but no value
    if (
      lastLine.endsWith(':') || 
      (/^[a-zA-Z-]+\s*:\s*[^;]*$/i.test(lastLine) && !lastLine.endsWith('}') && !lastLine.endsWith('{'))
    ) {
      lines.pop();
      continue;
    }
    // If the last line doesn't end with } or ; and does not contain { or }, it is likely a trailing selector or incomplete text.
    if (!lastLine.endsWith('}') && !lastLine.endsWith(';') && !lastLine.endsWith('*/') && !lastLine.includes('{') && !lastLine.includes('}')) {
      lines.pop();
      continue;
    }
    break;
  }
  fixed = lines.join('\n').trim();

  // 4. Drop dangling property declarations within braces
  fixed = fixed.replace(/([{;]\s*)([a-zA-Z-]+)\s*:\s*(?=\s*[{};]|\s*$)/g, '$1');
  fixed = fixed.replace(/\n\s*[a-zA-Z-]+\s*:\s*$/g, '');

  // 5. Ensure brace balancing
  let opens = 0;
  let cleanCss = '';
  let inComment = false;

  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    const nextChar = fixed[i + 1];

    if (inComment) {
      cleanCss += char;
      if (char === '*' && nextChar === '/') {
        inComment = false;
        cleanCss += '/';
        i++;
      }
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inComment = true;
      cleanCss += '/*';
      i++;
      continue;
    }

    if (char === '{') {
      opens++;
    } else if (char === '}') {
      if (opens > 0) {
        opens--;
      } else {
        continue;
      }
    }
    cleanCss += char;
  }

  if (opens > 0) {
    cleanCss += '\n' + '}'.repeat(opens);
  }

  return cleanCss.trim();
}

function mergeCssSources(...chunks) {
  return chunks.filter(Boolean).join('\n');
}

function sanitizeCss(css) {
  if (!css) return '';

  const lines = css.replace(/\0/g, '').split('\n');
  const seenImports = new Set();

  return lines
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('@import')) {
        if (seenImports.has(trimmed)) return false;
        seenImports.add(trimmed);
      }
      return true;
    })
    .join('\n')
    .trim();
}

function appendLayoutFixCss(css) {
  let sanitized = sanitizeCss(css);
  sanitized = repairTruncatedCss(sanitized);
  if (sanitized.includes(GRIP_FIX_MARKER)) {
    const markerIndex = sanitized.indexOf(GRIP_FIX_MARKER);
    const beforeFixes = repairTruncatedCss(sanitized.slice(0, markerIndex));
    return `${beforeFixes}\n${LAYOUT_FIX_CSS}`.trim();
  }
  return `${sanitized}\n${LAYOUT_FIX_CSS}`.trim();
}

export function postProcessGeneratedSite(html = '', css = '', website = {}) {
  ensureGripLogoAsset();

  const { bodyHtml, embeddedStyles } = extractEmbeddedStyles(html);
  let fixedHtml = fixGripLogoImages(bodyHtml);

  const mergedCss = mergeCssSources(css, ...embeddedStyles);

  if (website.logo) {
    const companyLogo = website.logo;
    const logoImg = `<img src="${companyLogo}" alt="${website.companyName || 'Logo'}" class="company-logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #E63946;">`;

    // Scope strictly to header-center so why-us icons are never replaced
    fixedHtml = fixedHtml.replace(
      /(<div[^>]*class=["'][^"']*header-center[^"']*["'][^>]*>)([\s\S]*?)(<\/div>)/i,
      (match, open, inner, close) => {
        let next = inner.replace(
          /<div[^>]*class=["'][^"']*(logo-placeholder|company-logo-placeholder)[^"']*["'][^>]*>[\s\S]*?<\/div>/i,
          logoImg
        );

        if (/company-logo|\blogo\b/i.test(next) && /<img\b/i.test(next)) {
          next = next.replace(
            /(<img[^>]*class=["'][^"']*(?:company-logo|logo)[^"']*["'][^>]*src=["'])[^"']*(["'])/i,
            `$1${companyLogo}$2`
          );
        } else if (/<div[^>]*class=["'][^"']*(?:circle|logo)[^"']*["'][^>]*>[\s\S]*?<\/div>/i.test(next)) {
          next = next.replace(
            /<div[^>]*class=["'][^"']*(?:circle|logo)[^"']*["'][^>]*>[\s\S]*?<\/div>/i,
            logoImg
          );
        }

        return `${open}${next}${close}`;
      }
    );
  }

  // Repair why-us AFTER logo injection so company logos never overwrite icons
  fixedHtml = normalizeHtmlStructure(fixedHtml, website);

  // FIX RELATIVE API URLS FOR CONTACT FORM FETCH (for already generated sites)
  const baseUrl = getPublicBaseUrl();
  fixedHtml = fixedHtml.replace(/fetch\(\s*['"`]\/api\/websites/g, `fetch('${baseUrl}/api/websites`);

  return {
    html: fixedHtml,
    css: appendLayoutFixCss(mergedCss),
  };
}

export function extractBodyHtml(html = '') {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();
}
