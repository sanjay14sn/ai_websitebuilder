import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPublicBaseUrl, getLocalUploadsUrl } from '../utils/publicUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRIP_LOGO_FILENAME = 'logo.png';
export const GRIP_FIX_MARKER = '/* GRIP generated-site layout fixes */';

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
  ensureGripLogoAsset();
  return getLocalUploadsUrl(GRIP_LOGO_FILENAME);
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
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-wrap: wrap !important;
  gap: 24px !important;
  padding: 40px 24px !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  width: 100% !important;
  background: #fff !important;
}
#header img[alt*="GRIP"],
#header img[alt*="Proud"],
#header .grip-badge,
#header .grip-badge img {
  width: 100px !important;
  height: 100px !important;
  max-width: 100px !important;
  object-fit: contain !important;
  flex-shrink: 0 !important;
  display: block !important;
}
#header .header-center,
#header > div:nth-child(2) {
  flex: 1 1 280px !important;
  text-align: center !important;
  min-width: 0 !important;
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

#why-us { padding: 80px 20px !important; background: #fff !important; }
#why-us .why-grid,
#why-us > div > div:not(:first-child),
#why-us [class*="grid"] {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
  gap: 20px !important;
  max-width: 1100px !important;
  margin: 0 auto !important;
  width: 100% !important;
}
#why-us [class*="card"] {
  background: #fff !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 16px !important;
  padding: 32px 24px !important;
  text-align: center !important;
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

@media (max-width: 768px) {
  /* 1. Global section padding scaling */
  section, #header, #about, #services, #why-us, #connect-form, #contact {
    padding: 60px 16px !important;
  }
  
  /* 2. Header collapser & alignments */
  #header {
    flex-direction: column !important;
    text-align: center !important;
    padding: 30px 16px !important;
  }
  #header .grip-badge {
    margin: 0 auto !important;
  }

  /* 3. Global grid collapser to 1 column */
  [class*="grid"], 
  [class*="row"],
  .about-grid,
  .services-grid,
  .why-grid,
  .contact-cards,
  .footer-grid {
    grid-template-columns: 1fr !important;
    flex-direction: column !important;
    gap: 20px !important;
  }

  /* 4. Font scale adjustments to prevent overflow */
  h1, .h1 { font-size: 28px !important; line-height: 1.2 !important; }
  h2, .h2 { font-size: 24px !important; line-height: 1.2 !important; }
  h3, .h3 { font-size: 20px !important; }
  
  /* 5. Image & Video fitting */
  img, video, iframe {
    width: 100% !important;
    height: auto !important;
    max-width: 100% !important;
    border-radius: 12px !important;
  }
  
  /* 6. Form elements adjustments */
  #connect-form form,
  #connect-form .contact-form {
    padding: 24px 16px !important;
    border-radius: 12px !important;
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
  .contact-form .captcha-row input {
    border-radius: 8px !important;
    margin: 4px 0 !important;
  }
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
    .replace(/https?:\/\/127\.0\.0\.1:5001\//gi, `${base}/`);
}

function fixGripLogoImages(html) {
  const logoUrl = getGripLogoUrl();
  let fixed = fixLocalhostUrls(html);

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

function normalizeHtmlStructure(html) {
  let fixed = html
    .replace(/\scontenteditable="[^"]*"/gi, '')
    .replace(/\sspellcheck="[^"]*"/gi, '')
    .replace(/\sdata-html-editable="[^"]*"/gi, '')
    .replace(/<div><br><\/div>/gi, '<br>');

  if (/#connect-form/i.test(fixed) && !/class=["'][^"']*form-field/i.test(fixed)) {
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
  fixedHtml = normalizeHtmlStructure(fixedHtml);

  const mergedCss = mergeCssSources(css, ...embeddedStyles);

  if (website.logo) {
    const companyLogo = website.logo;

    // 1. Replace the company logo placeholder div if present
    fixedHtml = fixedHtml.replace(
      /<div[^>]*class=["'][^"']*(logo-placeholder|company-logo-placeholder)[^"']*["'][^>]*>[\s\S]*?<\/div>/i,
      `<img src="${companyLogo}" alt="${website.companyName || 'Logo'}" class="company-logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #E63946;">`
    );

    // 2. Fallback replacement if the AI generated a FontAwesome wrapper div in the center column
    fixedHtml = fixedHtml.replace(
      /(<div[^>]*class=["'][^"']*header-center[^"']*["'][^>]*>[\s\S]*?<div[^>]*class=["'][^"']*(circle|icon|logo)[^"']*["'][^>]*>[\s\S]*?<\/div>)/i,
      (match, outerWrapper) => {
        return outerWrapper.replace(/<div[^>]*class=["'][^"']*(circle|icon|logo)[^"']*["'][^>]*>[\s\S]*?<\/div>/i, 
          `<img src="${companyLogo}" alt="${website.companyName || 'Logo'}" class="company-logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #E63946;">`
        );
      }
    );

    // 3. Update existing company logo image tag src if already present
    fixedHtml = fixedHtml.replace(
      /(<img[^>]*class=["'][^"']*(company-logo|logo)[^"']*["'][^>]*src=["'])[^"']*(["'])/i,
      `$1${companyLogo}$3`
    );
  }

  return {
    html: fixedHtml,
    css: appendLayoutFixCss(mergedCss),
  };
}

export function extractBodyHtml(html = '') {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();
}
