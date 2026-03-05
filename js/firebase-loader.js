/*
 * ============================================================
 *  DUNNWELL THERAPY - FIREBASE LOADER
 * ============================================================
 *  Loads site content from Cloud Firestore and merges it into
 *  SITE_CONFIG. Falls back to the static config.js values if
 *  Firebase is not configured or unreachable.
 *
 *  Usage: await loadFirebaseContent()  (called before rendering)
 * ============================================================
 */

/* global firebase, FIREBASE_CONFIG, SITE_CONFIG */

let _firebaseApp = null;
let _firestore = null;

function initFirebaseApp() {
  if (_firebaseApp) return true;
  if (typeof firebase === 'undefined' || !FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey) {
    return false;
  }
  try {
    _firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    _firestore = firebase.firestore();
    return true;
  } catch (e) {
    console.warn('Firebase init failed, using config.js fallback:', e.message);
    return false;
  }
}

function getFirestore() {
  return _firestore;
}

async function loadFirebaseContent() {
  if (!initFirebaseApp()) return;

  const db = _firestore;

  try {
    // Load all collections in parallel with 5s timeout
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
    const load = Promise.all([
      db.collection('settings').doc('general').get(),
      db.collection('services').orderBy('order', 'asc').get(),
      db.collection('blogPosts').orderBy('date', 'desc').get(),
      db.collection('testimonials').orderBy('order', 'asc').get(),
      db.collection('settings').doc('about').get(),
      db.collection('settings').doc('homepage').get(),
      db.collection('settings').doc('servicesPage').get()
    ]);
    const [
      settingsSnap,
      servicesSnap,
      blogSnap,
      testimonialsSnap,
      aboutSnap,
      homepageSnap,
      servicesPageSnap
    ] = await Promise.race([load, timeout]);

    // Merge settings
    if (settingsSnap.exists) {
      const s = settingsSnap.data();
      if (s.siteName) SITE_CONFIG.siteName = s.siteName;
      if (s.tagline) SITE_CONFIG.tagline = s.tagline;
      if (s.phone) SITE_CONFIG.phone = s.phone;
      if (s.fax) SITE_CONFIG.fax = s.fax;
      if (s.emailPrimary) SITE_CONFIG.emailPrimary = s.emailPrimary;
      if (s.emailSecondary) SITE_CONFIG.emailSecondary = s.emailSecondary;
      if (s.address) SITE_CONFIG.address = s.address;
      if (s.googleMapsEmbed) SITE_CONFIG.googleMapsEmbed = s.googleMapsEmbed;
      if (s.social) SITE_CONFIG.social = s.social;
      if (s.hours) SITE_CONFIG.hours = s.hours;
      if (s.serviceLocations) SITE_CONFIG.serviceLocations = s.serviceLocations;
      if (s.serviceInterests) SITE_CONFIG.serviceInterests = s.serviceInterests;
    }

    // Merge services
    if (!servicesSnap.empty) {
      SITE_CONFIG.services = servicesSnap.docs.map(doc => {
        const d = doc.data();
        d.id = d.id || doc.id;
        return d;
      });
    }

    // Merge blog posts
    if (!blogSnap.empty) {
      SITE_CONFIG.blogPosts = blogSnap.docs.map(doc => {
        const d = doc.data();
        d.id = d.id || doc.id;
        return d;
      });
    }

    // Merge testimonials
    if (!testimonialsSnap.empty) {
      SITE_CONFIG.testimonials = testimonialsSnap.docs.map(doc => doc.data());
    }

    // Merge homepage content
    if (homepageSnap.exists) {
      const h = homepageSnap.data();
      if (h.subtitle) SITE_CONFIG.subtitle = h.subtitle;
      if (h.heroTagline) SITE_CONFIG.heroTagline = h.heroTagline;
      if (h.heroDelivery) SITE_CONFIG.heroDelivery = h.heroDelivery;
      if (h.differentiators) SITE_CONFIG.differentiators = h.differentiators;
      if (h.whoWeHelp) SITE_CONFIG.whoWeHelp = h.whoWeHelp;
    }

    // Merge services page extras
    if (servicesPageSnap.exists) {
      const sp = servicesPageSnap.data();
      if (sp.approach) SITE_CONFIG.approach = sp.approach;
      if (sp.parentExpect) SITE_CONFIG.parentExpect = sp.parentExpect;
    }

    // Merge about/bio
    if (aboutSnap.exists) {
      const a = aboutSnap.data();
      Object.keys(a).forEach(key => {
        SITE_CONFIG.about[key] = a[key];
      });
    }

    // Load & apply theme colors
    try {
      const themeSnap = await db.collection('settings').doc('theme').get();
      if (themeSnap.exists) {
        const t = themeSnap.data();
        const root = document.documentElement;
        if (t.plum)      root.style.setProperty('--plum', t.plum);
        if (t.plumDeep)  root.style.setProperty('--plum-deep', t.plumDeep);
        if (t.plumLight) root.style.setProperty('--plum-light', t.plumLight);
        if (t.mauve)     root.style.setProperty('--mauve', t.mauve);
        if (t.bgWarm)    root.style.setProperty('--bg-warm', t.bgWarm);
        if (t.lavender)  root.style.setProperty('--lavender', t.lavender);
        if (t.bgCream)   root.style.setProperty('--bg-cream', t.bgCream);
        if (t.textDark)  root.style.setProperty('--text-dark', t.textDark);
        if (t.textBody)  root.style.setProperty('--text-body', t.textBody);
        // Derived colors
        if (t.lavender)  root.style.setProperty('--mauve-light', t.lavender);
        if (t.plum)      root.style.setProperty('--plum-medium', t.plum);

        // Border / radius overrides
        if (t.radiusSm)    root.style.setProperty('--radius-sm', t.radiusSm + 'px');
        if (t.radiusMd)    root.style.setProperty('--radius-md', t.radiusMd + 'px');
        if (t.radiusLg)    root.style.setProperty('--radius-lg', t.radiusLg + 'px');
        if (t.radiusXl)    root.style.setProperty('--radius-xl', t.radiusXl + 'px');
        // Card borders
        if (t.borderWidth && parseFloat(t.borderWidth) > 0) {
          var bw = t.borderWidth + 'px';
          var bc = t.borderColor || '#E4D0E4';
          document.querySelectorAll('.card, .feature-box, .contact-info-box, .testimonial-card, .blog-card, .process-step').forEach(function (el) {
            el.style.border = bw + ' solid ' + bc;
          });
        }

        // Page section borders
        var sbc = t.sectionBorderColor || '#C9A0C9';
        var sr = t.sectionRadius ? t.sectionRadius + 'px' : '0';
        if (t.heroBorder && parseFloat(t.heroBorder) > 0) {
          var heroEl2 = document.querySelector('.hero');
          if (heroEl2) { heroEl2.style.borderBottom = t.heroBorder + 'px solid ' + sbc; if (parseFloat(sr)) heroEl2.style.borderRadius = '0 0 ' + sr + ' ' + sr; }
        }
        if (t.pageHeroBorder && parseFloat(t.pageHeroBorder) > 0) {
          document.querySelectorAll('.page-hero').forEach(function (el) {
            el.style.borderBottom = t.pageHeroBorder + 'px solid ' + sbc;
            if (parseFloat(sr)) el.style.borderRadius = '0 0 ' + sr + ' ' + sr;
          });
        }
        if (t.ctaBorder && parseFloat(t.ctaBorder) > 0) {
          document.querySelectorAll('.cta-section').forEach(function (el) {
            el.style.border = t.ctaBorder + 'px solid ' + sbc;
            if (parseFloat(sr)) el.style.borderRadius = sr;
          });
        }
        if (t.footerBorder && parseFloat(t.footerBorder) > 0) {
          var footerEl = document.querySelector('.footer');
          if (footerEl) footerEl.style.borderTop = t.footerBorder + 'px solid ' + sbc;
        }

        // Helper: hex color to rgba string
        function hexRgba(hex, alpha) {
          hex = hex.replace('#', '');
          var r = parseInt(hex.substring(0, 2), 16);
          var g = parseInt(hex.substring(2, 4), 16);
          var b = parseInt(hex.substring(4, 6), 16);
          return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        }

        // Update hero gradient with theme colors + optional bg image
        var deep = t.plumDeep || '#4A1A3A';
        var mid  = t.plum     || '#6B2D5B';
        var lite = t.plumLight|| '#9B5F8B';
        var overlay = 'linear-gradient(160deg, ' + hexRgba(deep, 0.88) + ' 0%, ' + hexRgba(mid, 0.82) + ' 40%, ' + hexRgba(lite, 0.75) + ' 100%)';
        var heroEl = document.querySelector('.hero');
        if (heroEl) {
          if (t.heroBgImage) {
            heroEl.style.background = overlay + ', url(' + t.heroBgImage + ') center/cover no-repeat';
          } else {
            heroEl.style.background = overlay + ', linear-gradient(135deg, ' + deep + ', ' + mid + ')';
          }
          heroEl.style.backgroundSize = 'cover';
          heroEl.style.backgroundPosition = 'center';
        }

        // Update page-hero gradients (about, services, contact, etc.)
        document.querySelectorAll('.page-hero').forEach(function (el) {
          el.style.background = 'linear-gradient(160deg, ' + hexRgba(deep, 0.90) + ' 0%, ' + hexRgba(mid, 0.85) + ' 50%, ' + hexRgba(lite, 0.78) + ' 100%), linear-gradient(135deg, ' + deep + ', ' + mid + ')';
        });

        // Update CTA sections
        document.querySelectorAll('.cta-section').forEach(function (el) {
          el.style.background = deep;
        });

        SITE_CONFIG.theme = t;
      }
    } catch (e) {
      console.warn('Theme load skipped:', e.message);
    }

    // Load video testimonials
    try {
      const videoSnap = await db.collection('videoTestimonials').get();
      if (!videoSnap.empty) {
        const videos = [];
        videoSnap.forEach(doc => videos.push(doc.data()));
        videos.sort((a, b) => (a.order || 0) - (b.order || 0));
        SITE_CONFIG.videoTestimonials = videos;
      }
    } catch (e) {
      console.warn('Video testimonials load failed:', e.message);
    }

    // Load & apply siteContent (data-edit attributes)
    try {
      const contentSnap = await db.collection('settings').doc('siteContent').get();
      if (contentSnap.exists) {
        const content = contentSnap.data();
        document.querySelectorAll('[data-edit]').forEach(function (el) {
          var key = el.getAttribute('data-edit');
          // Support dotted keys like "homeHero.h1" → content.homeHero.h1
          var parts = key.split('.');
          var val = content;
          for (var i = 0; i < parts.length; i++) {
            if (val && typeof val === 'object' && parts[i] in val) {
              val = val[parts[i]];
            } else {
              val = undefined;
              break;
            }
          }
          if (val !== undefined && val !== '') {
            el.innerHTML = val;
          }
        });
      }
    } catch (e) {
      console.warn('Site content load skipped:', e.message);
    }

  } catch (err) {
    console.warn('Firebase load failed, using config.js fallback:', err.message);
  }
}

// Export for use by admin.js
window._dunnwellFirebase = {
  initFirebaseApp,
  getFirestore,
  loadFirebaseContent
};
