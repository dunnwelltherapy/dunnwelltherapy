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
