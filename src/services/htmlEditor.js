/** Inline-editing wrapper for AI-generated site HTML (same output as /preview). */

import { postProcessGeneratedSite, getSiteHeadAssets } from './sitePostProcessor.js';

const EDIT_CSS = `
  body.html-edit-mode form,
  body.html-edit-mode form * {
    pointer-events: none;
    user-select: none;
  }
  [data-html-editable="true"] {
    outline: 2px dashed transparent;
    border-radius: 3px;
    transition: outline-color 0.15s, background 0.15s;
    cursor: text;
  }
  [data-html-editable="true"]:hover,
  [data-html-editable="true"]:focus {
    outline-color: #3b82f6;
    background: rgba(59, 130, 246, 0.06);
  }
  img[data-html-image="true"] {
    cursor: pointer;
    outline: 2px dashed transparent;
    transition: outline-color 0.15s;
  }
  img[data-html-image="true"]:hover {
    outline-color: #3b82f6;
  }
  .html-edit-banner {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    background: #1e293b; color: #fff; font-size: 12px; font-weight: 600;
    padding: 8px 16px; border-radius: 999px; z-index: 99999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25); pointer-events: none;
  }
`;

const EDIT_SCRIPT = `
(function() {
  var EDITABLE_TAGS = { H1:1, H2:1, H3:1, H4:1, H5:1, H6:1, P:1, LI:1, FIGCAPTION:1, SPAN:1, STRONG:1, EM:1 };
  var imageCounter = 0;

  document.body.classList.add('html-edit-mode');

  function isProtected(el) {
    if (el.closest('form')) return true;
    if (el.closest('script')) return true;
    if (el.closest('style')) return true;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON' || el.tagName === 'SELECT' || el.tagName === 'LABEL') return true;
    return false;
  }

  function canEditText(el) {
    if (isProtected(el)) return false;
    if (!EDITABLE_TAGS[el.tagName]) return false;
    if (!(el.textContent || '').trim()) return false;
    if (el.closest('form')) return false;
    if (el.querySelector && el.querySelector('form')) return false;
    if (el.tagName === 'SPAN' && el.children.length > 0) return false;
    return true;
  }

  function markEditable(root) {
    root.querySelectorAll('img').forEach(function(el) {
      if (isProtected(el)) return;
      var imageId = el.getAttribute('data-html-image-id');
      if (!imageId) {
        imageId = 'img-' + (imageCounter++);
        el.setAttribute('data-html-image-id', imageId);
      }
      el.setAttribute('data-html-image', 'true');
      el.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'html-image-edit',
          imageId: imageId,
          src: el.getAttribute('src') || ''
        }, '*');
      });
    });

    root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,figcaption,span,strong,em').forEach(function(el) {
      if (!canEditText(el)) return;
      el.setAttribute('data-html-editable', 'true');
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');
      el.addEventListener('blur', function() {
        window.parent.postMessage({ type: 'html-edited' }, '*');
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && el.tagName !== 'P' && el.tagName !== 'LI') {
          e.preventDefault();
          el.blur();
        }
      });
    });
  }

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'update-image' && e.data.imageId) {
      var img = document.querySelector('img[data-html-image-id="' + e.data.imageId + '"]');
      if (img) {
        img.setAttribute('src', e.data.value);
        img.removeAttribute('srcset');
      }
    }
    if (e.data && e.data.type === 'get-html-snapshot') {
      var banner = document.querySelector('.html-edit-banner');
      var script = document.querySelector('script[data-html-editor]');
      if (banner) banner.remove();
      if (script) script.remove();
      document.querySelectorAll('[data-html-editable]').forEach(function(el) {
        el.removeAttribute('contenteditable');
        el.removeAttribute('data-html-editable');
        el.removeAttribute('spellcheck');
      });
      document.querySelectorAll('[data-html-image]').forEach(function(el) {
        el.removeAttribute('data-html-image');
      });
      window.parent.postMessage({ type: 'html-snapshot', html: document.body.innerHTML }, '*');
      if (banner) document.body.appendChild(banner);
      if (script) document.body.appendChild(script);
    }
  });

  markEditable(document.body);
  var banner = document.createElement('div');
  banner.className = 'html-edit-banner';
  banner.textContent = 'Click any text to edit · Click images to replace';
  document.body.appendChild(banner);
})();
`;

function extractEmbeddedStyles(html = '') {
  const styles = [];
  const cleaned = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    styles.push(css.trim());
    return '';
  });
  return { bodyHtml: cleaned.trim(), embeddedStyles: styles };
}

export function getStoredCss(website) {
  const { embeddedStyles } = extractEmbeddedStyles(website.generatedHtml || '');
  return [website.generatedCss || '', ...embeddedStyles].filter(Boolean).join('\n');
}

export function buildEditableSiteDocument(website) {
  const processed = postProcessGeneratedSite(website.generatedHtml || '', website.generatedCss || '', website);
  const { bodyHtml, embeddedStyles } = extractEmbeddedStyles(processed.html || '');
  const css = [processed.css || '', ...embeddedStyles, EDIT_CSS].filter(Boolean).join('\n');
  const title = website.companyName || 'Edit Website';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${getSiteHeadAssets()}
  <style>${css}</style>
</head>
<body>
${bodyHtml}
<script data-html-editor="true">${EDIT_SCRIPT}</script>
</body>
</html>`;
}

export function extractCssFromDocument(doc) {
  return Array.from(doc.querySelectorAll('style'))
    .filter((el) => !el.hasAttribute('data-html-editor'))
    .map((el) => el.textContent || '')
    .join('\n')
    .replace(EDIT_CSS, '')
    .trim();
}

export function cleanBodyHtmlForSave(html) {
  return html
    .replace(/<script[^>]*data-html-editor[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<div class="html-edit-banner">[\s\S]*?<\/div>/gi, '')
    .replace(/\scontenteditable="[^"]*"/gi, '')
    .replace(/\sspellcheck="[^"]*"/gi, '')
    .replace(/\sdata-html-editable="[^"]*"/gi, '')
    .replace(/\sdata-html-image="[^"]*"/gi, '')
    .replace(/class="html-edit-mode"/gi, '')
    .replace(/<div><br><\/div>/gi, '<br>')
    .trim();
}
