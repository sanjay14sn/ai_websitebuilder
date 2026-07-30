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
  [data-html-removable="true"] {
    position: relative !important;
    outline: 2px dashed transparent;
    transition: outline-color 0.15s, box-shadow 0.15s;
  }
  [data-html-removable="true"]:hover {
    outline-color: #ef4444 !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12) !important;
    z-index: 5 !important;
  }
  .html-remove-btn {
    position: absolute !important;
    top: 8px !important;
    right: 8px !important;
    z-index: 10000 !important;
    width: 32px !important;
    height: 32px !important;
    border: 2px solid #fff !important;
    border-radius: 999px !important;
    background: #ef4444 !important;
    color: #fff !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25) !important;
    padding: 0 !important;
    margin: 0 !important;
    pointer-events: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  .html-remove-btn:hover {
    background: #dc2626 !important;
    transform: scale(1.05);
  }
  .service-card, .why-us-card, .contact-card, [data-html-removable="true"] {
    position: relative !important;
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
  var REMOVABLE_SELECTORS = [
    '.service-card',
    '.services-grid > article',
    '.services-grid > div',
    '#services [class*="card"]',
    '.why-us-card',
    '.why-card',
    '.why-us-grid > div',
    '#why-us [class*="card"]',
    '.contact-card',
    '.contact-cards > div',
    '.gallery-item',
    '.gallery-grid > div',
    '#gallery [class*="item"]',
    '#gallery figure'
  ].join(',');

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

  function isRemovableCard(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest('form') || el.closest('header') || el.id === 'header') return false;
    if (el.id === 'services' || el.id === 'why-us' || el.id === 'contact' || el.id === 'gallery' || el.id === 'about' || el.id === 'connect-form') return false;
    if (/grid|container|section-header|section-label|pill-badge/i.test(el.className || '')) {
      // allow grid children, not the grid/container itself when matched by descendant selectors
    }
    var cls = (el.className || '').toString();
    if (/\\b(service-card|why-us-card|why-card|contact-card|gallery-item)\\b/i.test(cls)) return true;
    if (/card/i.test(cls) && el.closest('#services, #why-us, #contact, .services-grid, .why-us-grid, .contact-cards')) return true;
    if (el.tagName === 'ARTICLE' && el.closest('#services, .services-grid')) return true;
    if (el.tagName === 'FIGURE' && el.closest('#gallery, .gallery-grid')) return true;
    // Direct children of known grids that look like cards (have image + text)
    var parent = el.parentElement;
    if (parent && /services-grid|why-us-grid|why-grid|contact-cards|gallery-grid|gallery/i.test(parent.className || '')) {
      if (el.querySelector('img') && (el.querySelector('h2,h3,h4,h5,p') || (el.textContent || '').trim().length > 8)) {
        return true;
      }
    }
    return false;
  }

  function stripEditorUi(root) {
    root.querySelectorAll('.html-remove-btn').forEach(function(btn) { btn.remove(); });
    root.querySelectorAll('[data-html-removable]').forEach(function(el) {
      el.removeAttribute('data-html-removable');
    });
  }

  function markRemovable(root) {
    var seen = new Set();
    root.querySelectorAll(REMOVABLE_SELECTORS).forEach(function(el) {
      if (!isRemovableCard(el)) return;
      if (seen.has(el)) return;
      seen.add(el);
      if (el.getAttribute('data-html-removable') === 'true') return;

      el.setAttribute('data-html-removable', 'true');
      if (window.getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'html-remove-btn';
      btn.setAttribute('aria-label', 'Remove this block');
      btn.title = 'Remove this block';
      btn.innerHTML = '&times;';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Remove this block? You can undo by not saving.')) return;
        el.remove();
        window.parent.postMessage({ type: 'html-edited' }, '*');
      });
      el.appendChild(btn);
    });
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

    markRemovable(root);
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
      stripEditorUi(document);
      window.parent.postMessage({ type: 'html-snapshot', html: document.body.innerHTML }, '*');
      if (banner) document.body.appendChild(banner);
      if (script) document.body.appendChild(script);
      markRemovable(document.body);
    }
  });

  markEditable(document.body);
  var banner = document.createElement('div');
  banner.className = 'html-edit-banner';
  banner.textContent = 'Click text to edit · Click images to replace · Red × on service cards deletes them';
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
    .replace(/<button[^>]*class="[^"]*html-remove-btn[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/\scontenteditable="[^"]*"/gi, '')
    .replace(/\sspellcheck="[^"]*"/gi, '')
    .replace(/\sdata-html-editable="[^"]*"/gi, '')
    .replace(/\sdata-html-image="[^"]*"/gi, '')
    .replace(/\sdata-html-removable="[^"]*"/gi, '')
    .replace(/class="html-edit-mode"/gi, '')
    .replace(/<div><br><\/div>/gi, '<br>')
    .trim();
}
