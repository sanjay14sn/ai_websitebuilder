function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function editAttr(field, editMode, type = 'text') {
  if (!editMode) return '';
  return ` data-edit-field="${escapeHtml(field)}" data-edit-type="${escapeHtml(type)}"${
    type === 'text' ? ' contenteditable="true" spellcheck="true"' : ''
  }`;
}

function renderHero(section, theme, editMode) {
  const c = section.content || {};
  const sid = section.id;
  const bg = c.backgroundImage
    ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${escapeHtml(c.backgroundImage)}')`
    : theme.primaryColor;

  return `
    <section id="${escapeHtml(section.id)}" class="section hero-section" style="background-image:${bg};"${editAttr(`${sid}:content.backgroundImage`, editMode, 'image-bg')}>
      <div class="container hero-inner">
        <h1${editAttr(`${sid}:title`, editMode)}>${escapeHtml(section.title || '')}</h1>
        <p class="subtitle"${editAttr(`${sid}:subtitle`, editMode)}>${escapeHtml(section.subtitle || '')}</p>
        ${c.ctaText ? `<a class="btn-primary" href="${escapeHtml(c.ctaLink || '#contact')}"${editAttr(`${sid}:content.ctaText`, editMode)} data-link-field="${escapeHtml(`${sid}:content.ctaLink`)}">${escapeHtml(c.ctaText)}</a>` : ''}
      </div>
    </section>
  `;
}

function renderAbout(section, theme, editMode) {
  const c = section.content || {};
  const sid = section.id;
  return `
    <section id="${escapeHtml(section.id)}" class="section about-section">
      <div class="container about-grid">
        <div>
          <p class="eyebrow" style="color:${theme.primaryColor}"${editAttr(`${sid}:title`, editMode)}>${escapeHtml(section.title || '')}</p>
          <h2${editAttr(`${sid}:subtitle`, editMode)}>${escapeHtml(section.subtitle || '')}</h2>
          <p class="body-text"${editAttr(`${sid}:content.bodyText`, editMode)}>${escapeHtml(c.bodyText || '').replace(/\n/g, '<br/>')}</p>
        </div>
        ${c.image ? `<div class="about-image editable-image-wrap"${editAttr(`${sid}:content.image`, editMode, 'image')}><img src="${escapeHtml(c.image)}" alt="${escapeHtml(section.title || 'About')}" /><span class="image-edit-hint">Click to change image</span></div>` : `<div class="about-image editable-image-wrap placeholder-image"${editAttr(`${sid}:content.image`, editMode, 'image')}><span class="image-edit-hint">Click to add image</span></div>`}
      </div>
    </section>
  `;
}

function renderServices(section, theme, editMode) {
  const c = section.content || {};
  const items = c.items || [];
  const sid = section.id;
  return `
    <section id="${escapeHtml(section.id)}" class="section services-section">
      <div class="container">
        <h2 class="section-title"${editAttr(`${sid}:title`, editMode)}>${escapeHtml(section.title || '')}</h2>
        <p class="section-subtitle"${editAttr(`${sid}:subtitle`, editMode)}>${escapeHtml(section.subtitle || '')}</p>
        <div class="services-grid">
          ${items
            .map(
              (item, idx) => `
            <article class="service-card">
              ${item.image ? `<div class="editable-image-wrap service-image-wrap"${editAttr(`${sid}:content.items.${idx}.image`, editMode, 'image')}><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || '')}" class="service-image" /><span class="image-edit-hint">Change</span></div>` : `<div class="editable-image-wrap service-image-wrap placeholder-image"${editAttr(`${sid}:content.items.${idx}.image`, editMode, 'image')}><span class="image-edit-hint">Add image</span></div>`}
              <h3${editAttr(`${sid}:content.items.${idx}.title`, editMode)}>${escapeHtml(item.title || '')}</h3>
              <p${editAttr(`${sid}:content.items.${idx}.description`, editMode)}>${escapeHtml(item.description || '')}</p>
            </article>
          `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}

function renderGallery(section, theme, editMode) {
  const c = section.content || {};
  const images = c.images || [];
  const sid = section.id;
  return `
    <section id="${escapeHtml(section.id)}" class="section gallery-section">
      <div class="container">
        <h2 class="section-title"${editAttr(`${sid}:title`, editMode)}>${escapeHtml(section.title || '')}</h2>
        <p class="section-subtitle"${editAttr(`${sid}:subtitle`, editMode)}>${escapeHtml(section.subtitle || '')}</p>
        <div class="gallery-grid">
          ${images
            .map(
              (img, idx) => `
            <figure class="gallery-item">
              <div class="editable-image-wrap"${editAttr(`${sid}:content.images.${idx}.url`, editMode, 'image')}>
                <img src="${escapeHtml(img.url || '')}" alt="${escapeHtml(img.caption || 'Gallery')}" />
                <span class="image-edit-hint">Change</span>
              </div>
              <figcaption${editAttr(`${sid}:content.images.${idx}.caption`, editMode)}>${escapeHtml(img.caption || '')}</figcaption>
            </figure>
          `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}

function renderContact(section, theme, website, editMode) {
  const c = section.content || {};
  const phone = c.phone || website.phoneNumber || '';
  const email = c.email || website.email || '';
  const address = c.address || website.location || '';
  const formTitle = c.formTitle || 'Send us a message';
  const submitText = c.submitText || 'Send Message';
  const sid = section.id;

  return `
    <section id="${escapeHtml(section.id)}" class="section contact-section">
      <div class="container contact-grid">
        <div>
          <h2${editAttr(`${sid}:title`, editMode)}>${escapeHtml(section.title || '')}</h2>
          <p class="section-subtitle"${editAttr(`${sid}:subtitle`, editMode)}>${escapeHtml(section.subtitle || '')}</p>
          <ul class="contact-list">
            <li><strong>Phone:</strong> <span${editAttr(`${sid}:content.phone`, editMode)}>${escapeHtml(phone)}</span></li>
            <li><strong>Email:</strong> <span${editAttr(`${sid}:content.email`, editMode)}>${escapeHtml(email)}</span></li>
            <li><strong>Address:</strong> <span${editAttr(`${sid}:content.address`, editMode)}>${escapeHtml(address)}</span></li>
          </ul>
        </div>
        <form class="contact-form" onsubmit="return false;">
          <h3${editAttr(`${sid}:content.formTitle`, editMode)}>${escapeHtml(formTitle)}</h3>
          <input type="text" placeholder="${escapeHtml(c.namePlaceholder || 'Your Name')}" data-edit-field="${escapeHtml(`${sid}:content.namePlaceholder`)}" data-edit-type="placeholder" />
          <input type="email" placeholder="${escapeHtml(c.emailPlaceholder || 'Your Email')}" data-edit-field="${escapeHtml(`${sid}:content.emailPlaceholder`)}" data-edit-type="placeholder" />
          <input type="tel" placeholder="${escapeHtml(c.phonePlaceholder || 'Your Phone')}" data-edit-field="${escapeHtml(`${sid}:content.phonePlaceholder`)}" data-edit-type="placeholder" />
          <textarea rows="4" placeholder="${escapeHtml(c.messagePlaceholder || 'Your Message')}" data-edit-field="${escapeHtml(`${sid}:content.messagePlaceholder`)}" data-edit-type="placeholder"></textarea>
          <button type="button" class="btn-primary"${editAttr(`${sid}:content.submitText`, editMode)}>${escapeHtml(submitText)}</button>
        </form>
      </div>
    </section>
  `;
}

function renderSection(section, theme, website, editMode) {
  switch (section.type) {
    case 'hero':
      return renderHero(section, theme, editMode);
    case 'about':
      return renderAbout(section, theme, editMode);
    case 'services':
      return renderServices(section, theme, editMode);
    case 'gallery':
      return renderGallery(section, theme, editMode);
    case 'contact':
      return renderContact(section, theme, website, editMode);
    default:
      return '';
  }
}

function buildCss(theme, editMode) {
  const primary = theme.primaryColor || '#c21a22';
  const secondary = theme.secondaryColor || '#171717';
  const background = theme.backgroundColor || '#ffffff';
  const text = theme.textColor || '#171717';
  const font = theme.fontFamily || 'Inter';

  let css = `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: '${font}', sans-serif;
      background: ${background};
      color: ${text};
      line-height: 1.6;
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
    .site-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; border-bottom: 1px solid #eaeaea; background: #fff;
      position: sticky; top: 0; z-index: 10;
    }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; color: ${secondary}; }
    .brand img { height: 40px; width: auto; object-fit: contain; }
    .nav-links { display: flex; gap: 16px; flex-wrap: wrap; }
    .nav-links a { color: #525252; text-decoration: none; font-size: 14px; font-weight: 600; }
    .nav-links a:hover { color: ${primary}; }
    .section { padding: 64px 0; }
    .hero-section {
      color: #fff; text-align: center; background-size: cover; background-position: center;
      min-height: 420px; display: flex; align-items: center;
    }
    .hero-inner { width: 100%; }
    .hero-section h1 { font-size: 2.5rem; margin: 0 0 12px; }
    .subtitle { font-size: 1rem; opacity: 0.9; max-width: 640px; margin: 0 auto 24px; }
    .btn-primary {
      display: inline-block; background: ${primary}; color: #fff; padding: 12px 24px;
      border-radius: 999px; text-decoration: none; border: none; cursor: pointer; font-weight: 700;
    }
    .about-section { background: #fafafa; }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; }
    .about-image img { width: 100%; border-radius: 16px; object-fit: cover; }
    .eyebrow { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .body-text { color: #525252; }
    .section-title { text-align: center; color: ${secondary}; margin-bottom: 8px; }
    .section-subtitle { text-align: center; color: #737373; margin: 0 0 32px; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .service-card { border: 1px solid #eaeaea; border-radius: 16px; padding: 20px; background: #fff; }
    .service-image { width: 100%; height: 160px; object-fit: cover; border-radius: 12px; margin-bottom: 12px; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .gallery-item img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; }
    .gallery-item figcaption { font-size: 12px; color: #737373; margin-top: 8px; }
    .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .contact-list { list-style: none; padding: 0; color: #525252; }
    .contact-list li { margin-bottom: 8px; }
    .contact-form { background: #fafafa; border: 1px solid #eaeaea; border-radius: 16px; padding: 24px; display: grid; gap: 12px; }
    .contact-form input, .contact-form textarea {
      width: 100%; padding: 12px 14px; border: 1px solid #d4d4d4; border-radius: 10px; font: inherit;
    }
    .site-footer {
      background: ${secondary}; color: #fff; padding: 32px 24px; text-align: center;
    }
    .social-links { display: flex; justify-content: center; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
    .social-links a { color: #fff; text-decoration: none; font-size: 14px; }
    @media (max-width: 768px) {
      .about-grid, .contact-grid { grid-template-columns: 1fr; }
      .hero-section h1 { font-size: 1.8rem; }
      .site-header { flex-direction: column; gap: 12px; align-items: flex-start; }
    }
  `;

  if (editMode) {
    css += `
      [data-edit-field][data-edit-type="text"] {
        outline: 2px dashed transparent;
        border-radius: 4px;
        transition: outline-color 0.15s, background 0.15s;
        cursor: text;
      }
      [data-edit-field][data-edit-type="text"]:hover,
      [data-edit-field][data-edit-type="text"]:focus {
        outline-color: #3b82f6;
        background: rgba(59, 130, 246, 0.08);
      }
      [data-edit-type="image"], [data-edit-type="image-bg"] { cursor: pointer; }
      .editable-image-wrap { position: relative; }
      .editable-image-wrap .image-edit-hint {
        position: absolute; bottom: 8px; right: 8px;
        background: rgba(37, 99, 235, 0.9); color: #fff;
        font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px;
        opacity: 0; transition: opacity 0.15s; pointer-events: none;
      }
      .editable-image-wrap:hover .image-edit-hint,
      [data-edit-type="image-bg"]:hover::after { opacity: 1; }
      .placeholder-image {
        min-height: 160px; background: #e5e5e5; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
      }
      .placeholder-image .image-edit-hint { position: static; opacity: 1; background: #737373; }
      .hero-section[data-edit-type="image-bg"]::after {
        content: 'Click to change background';
        position: absolute; top: 12px; right: 12px;
        background: rgba(37, 99, 235, 0.9); color: #fff;
        font-size: 11px; font-weight: 700; padding: 6px 10px; border-radius: 6px;
        opacity: 0; transition: opacity 0.15s; pointer-events: none;
      }
      .hero-section { position: relative; }
      [data-edit-type="placeholder"] { border-color: #93c5fd !important; }
      [data-edit-type="placeholder"]:focus { outline: 2px solid #3b82f6; }
      .edit-mode-banner {
        position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
        background: #1e293b; color: #fff; font-size: 12px; font-weight: 600;
        padding: 8px 16px; border-radius: 999px; z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2); pointer-events: none;
      }
    `;
  }

  return css;
}

function buildEditorScript() {
  return `
    (function() {
      function post(field, value) {
        window.parent.postMessage({ type: 'layout-edit', field, value }, '*');
      }

      document.querySelectorAll('[data-edit-field][data-edit-type="text"]').forEach(function(el) {
        el.addEventListener('blur', function() {
          post(el.getAttribute('data-edit-field'), el.innerText.trim());
        });
        el.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey && el.tagName !== 'P' && !el.classList.contains('body-text')) {
            e.preventDefault();
            el.blur();
          }
        });
      });

      document.querySelectorAll('[data-edit-type="image"], [data-edit-type="image-bg"]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          if (e.target.closest('[contenteditable="true"]')) return;
          e.preventDefault();
          e.stopPropagation();
          window.parent.postMessage({
            type: 'layout-image-edit',
            field: el.getAttribute('data-edit-field')
          }, '*');
        });
      });

      document.querySelectorAll('[data-edit-type="placeholder"]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          window.parent.postMessage({
            type: 'layout-placeholder-edit',
            field: el.getAttribute('data-edit-field'),
            value: el.getAttribute('placeholder') || ''
          }, '*');
        });
        el.setAttribute('readonly', 'true');
        el.style.cursor = 'pointer';
      });

      document.querySelectorAll('[data-link-field]').forEach(function(el) {
        el.addEventListener('dblclick', function(e) {
          e.preventDefault();
          window.parent.postMessage({
            type: 'layout-link-edit',
            field: el.getAttribute('data-link-field'),
            value: el.getAttribute('href') || ''
          }, '*');
        });
      });

      var banner = document.createElement('div');
      banner.className = 'edit-mode-banner';
      banner.textContent = 'Click text to edit · Click images to change · Double-click buttons to edit link';
      document.body.appendChild(banner);
    })();
  `;
}

export function compileLayoutToSite(website, layout, options = {}) {
  if (!layout || !Array.isArray(layout.sections)) {
    throw new Error('Invalid layout payload');
  }

  const editMode = Boolean(options.editMode);
  const theme = layout.themeSettings || {};
  const seo = layout.seoSettings || {};
  const companyName = website.companyName || 'Business';
  const logo = website.logo || '';
  const social = website.socialLinks || {};

  const navLinks = layout.sections
    .map((s) => `<a href="#${escapeHtml(s.id)}">${escapeHtml(s.title || s.type)}</a>`)
    .join('');

  const socialLinks = [
    social.facebook ? `<a href="${escapeHtml(social.facebook)}" target="_blank" rel="noopener">Facebook</a>` : '',
    social.instagram ? `<a href="${escapeHtml(social.instagram)}" target="_blank" rel="noopener">Instagram</a>` : '',
    social.twitter ? `<a href="${escapeHtml(social.twitter)}" target="_blank" rel="noopener">Twitter</a>` : '',
    social.linkedin ? `<a href="${escapeHtml(social.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : '',
  ]
    .filter(Boolean)
    .join('');

  const sectionsHtml = layout.sections
    .map((section) => renderSection(section, theme, website, editMode))
    .join('\n');
  const css = buildCss(theme, editMode);

  const html = `
    <header class="site-header">
      <div class="brand">
        ${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(companyName)}" />` : ''}
        <span>${escapeHtml(companyName)}</span>
      </div>
      <nav class="nav-links">${navLinks}</nav>
    </header>
    <main>${sectionsHtml}</main>
    <footer class="site-footer">
      <p>&copy; ${new Date().getFullYear()} ${escapeHtml(companyName)}. All rights reserved.</p>
      ${socialLinks ? `<div class="social-links">${socialLinks}</div>` : ''}
    </footer>
  `;

  return {
    html,
    css,
    editorScript: editMode ? buildEditorScript() : '',
    pageTitle: seo.title || `${companyName} | Official Website`,
    metaDescription: seo.description || website.description || '',
    metaKeywords: seo.keywords || '',
  };
}
