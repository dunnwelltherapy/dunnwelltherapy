/* ============================================================
   DUNNWELL THERAPY - ADMIN PANEL
   ============================================================
   Handles authentication, CRUD operations for all content,
   image uploads, Quill rich text editor, and config import.
   ============================================================ */

/* global firebase, FIREBASE_CONFIG, SITE_CONFIG, Quill */

(function () {
  'use strict';

  // ---- State ----
  let db = null;
  let storage = null;
  let auth = null;
  let quillEditor = null;
  let pendingDeleteFn = null;

  // Clinical Notes state
  let selectedPatientId = null;
  let selectedPatientData = null;
  let patientsCache = [];
  let patientFilter = 'active';
  let noteAutoSaveTimer = null;

  // ---- Init Firebase ----
  function initFirebase() {
    if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey) {
      showToast('Firebase not configured. Please fill in js/firebase-config.js', 'error');
      return false;
    }
    try {
      const app = firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      storage = firebase.storage();
      auth = firebase.auth();
      return true;
    } catch (e) {
      showToast('Firebase init failed: ' + e.message, 'error');
      return false;
    }
  }

  // ---- Auth ----
  function setupAuth() {
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const adminApp = document.getElementById('admin-app');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');

      try {
        errorEl.classList.remove('show');
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        errorEl.textContent = getAuthErrorMessage(err.code);
        errorEl.classList.add('show');
      }
    });

    auth.onAuthStateChanged((user) => {
      if (user) {
        loginScreen.style.display = 'none';
        adminApp.style.display = 'grid';
        loadDashboard();
      } else {
        loginScreen.style.display = 'flex';
        adminApp.style.display = 'none';
      }
    });

    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      auth.signOut();
    });
  }

  function getAuthErrorMessage(code) {
    const messages = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    return messages[code] || 'Sign in failed. Please try again.';
  }

  // ---- Navigation ----
  function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.section;

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById('section-' + sectionId).classList.add('active');

        // Close mobile sidebar
        document.getElementById('admin-sidebar').classList.remove('open');

        // Load section data
        loadSectionData(sectionId);
      });
    });

    // Mobile sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.toggle('open');
    });
  }

  function loadSectionData(section) {
    switch (section) {
      case 'dashboard': loadDashboard(); break;
      case 'homepage': loadHomepage(); break;
      case 'blog': loadBlogPosts(); break;
      case 'testimonials': loadTestimonials(); break;
      case 'services': loadServices(); loadServicesExtra(); break;
      case 'about': loadAbout(); break;
      case 'settings': loadSettings(); break;
      case 'images': loadImages(); break;
      case 'notes': loadPatients(); break;
    }
  }

  // ---- Dashboard ----
  async function loadDashboard() {
    try {
      const [blogSnap, testimSnap, servSnap, patientsSnap] = await Promise.all([
        db.collection('blogPosts').get(),
        db.collection('testimonials').get(),
        db.collection('services').get(),
        db.collection('patients').get()
      ]);
      document.getElementById('stat-posts').textContent = blogSnap.size;
      document.getElementById('stat-testimonials').textContent = testimSnap.size;
      document.getElementById('stat-services').textContent = servSnap.size;
      document.getElementById('stat-patients').textContent = patientsSnap.size;

      // Count images
      try {
        const listResult = await storage.ref('images').listAll();
        document.getElementById('stat-images').textContent = listResult.items.length;
      } catch (e) {
        document.getElementById('stat-images').textContent = '0';
      }
    } catch (e) {
      console.warn('Dashboard load:', e.message);
    }
  }

  // ---- Blog Posts ----
  async function loadBlogPosts() {
    const container = document.getElementById('blog-list');
    container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

    try {
      const snap = await db.collection('blogPosts').orderBy('date', 'desc').get();
      if (snap.empty) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><h4>No blog posts yet</h4><p>Create your first blog post to get started.</p></div>';
        return;
      }

      let html = '<table class="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
      snap.forEach(doc => {
        const d = doc.data();
        const date = d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        html += `<tr>
          <td><strong>${escapeHtml(d.title || '')}</strong></td>
          <td><span style="background:#F3E8F3;color:#6B2D5B;padding:0.2rem 0.6rem;border-radius:100px;font-size:0.78rem;font-weight:600;">${escapeHtml(d.category || '')}</span></td>
          <td style="color:#7A6A7B;">${date}</td>
          <td><div class="table-actions">
            <button class="edit-btn" title="Edit" onclick="adminPanel.editBlog('${doc.id}')"><i class="fas fa-pen"></i></button>
            <button class="delete-btn" title="Delete" onclick="adminPanel.deleteBlog('${doc.id}')"><i class="fas fa-trash"></i></button>
          </div></td>
        </tr>`;
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading posts</h4><p>' + escapeHtml(e.message) + '</p></div>';
    }
  }

  function openBlogModal(data) {
    document.getElementById('blog-modal-title').textContent = data ? 'Edit Blog Post' : 'New Blog Post';
    document.getElementById('blog-edit-id').value = data ? data._docId : '';
    document.getElementById('blog-title').value = data ? data.title : '';
    document.getElementById('blog-category').value = data ? data.category : '';
    document.getElementById('blog-date').value = data ? data.date : new Date().toISOString().split('T')[0];
    document.getElementById('blog-author').value = data ? data.author : 'Bianca Dunn, MSOT, OTR/L';
    document.getElementById('blog-excerpt').value = data ? data.excerpt : '';

    // Image preview
    const previewEl = document.getElementById('blog-image-preview');
    const previewImg = document.getElementById('blog-image-preview-img');
    if (data && data.image) {
      previewImg.src = data.image;
      previewEl.style.display = 'inline-block';
    } else {
      previewEl.style.display = 'none';
      previewImg.src = '';
    }

    // Set Quill content
    if (!quillEditor) {
      quillEditor = new Quill('#blog-editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean']
          ]
        },
        placeholder: 'Write your blog post content...'
      });
    }
    if (data && data.content) {
      quillEditor.root.innerHTML = data.content;
    } else {
      quillEditor.root.innerHTML = '';
    }

    showModal('blog-modal');
  }

  async function saveBlogPost() {
    const docId = document.getElementById('blog-edit-id').value;
    const title = document.getElementById('blog-title').value.trim();
    const category = document.getElementById('blog-category').value.trim();

    if (!title || !category) {
      showToast('Title and category are required.', 'error');
      return;
    }

    const content = quillEditor.root.innerHTML;
    const slug = docId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const postData = {
      id: slug,
      title: title,
      category: category,
      date: document.getElementById('blog-date').value || new Date().toISOString().split('T')[0],
      author: document.getElementById('blog-author').value.trim() || 'Bianca Dunn, MSOT, OTR/L',
      excerpt: document.getElementById('blog-excerpt').value.trim(),
      content: content,
      image: document.getElementById('blog-image-preview-img').src || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Upload image if a file was selected
    const fileInput = document.getElementById('blog-image-file');
    if (fileInput.files.length > 0) {
      try {
        const url = await uploadImage(fileInput.files[0], 'blog/' + slug);
        postData.image = url;
      } catch (e) {
        showToast('Image upload failed: ' + e.message, 'error');
      }
    }

    try {
      if (docId) {
        await db.collection('blogPosts').doc(docId).update(postData);
      } else {
        await db.collection('blogPosts').doc(slug).set(postData);
      }
      showToast('Blog post saved!', 'success');
      closeModal('blog-modal');
      loadBlogPosts();
      loadDashboard();
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  async function editBlog(docId) {
    try {
      const doc = await db.collection('blogPosts').doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        data._docId = doc.id;
        openBlogModal(data);
      }
    } catch (e) {
      showToast('Error loading post: ' + e.message, 'error');
    }
  }

  function deleteBlog(docId) {
    pendingDeleteFn = async () => {
      try {
        await db.collection('blogPosts').doc(docId).delete();
        showToast('Blog post deleted.', 'success');
        loadBlogPosts();
        loadDashboard();
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    showModal('confirm-modal');
  }

  // ---- Testimonials ----
  async function loadTestimonials() {
    const container = document.getElementById('testimonials-list');
    container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

    try {
      const snap = await db.collection('testimonials').orderBy('order', 'asc').get();
      if (snap.empty) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-quote-right"></i><h4>No testimonials yet</h4><p>Add your first client testimonial.</p></div>';
        return;
      }

      container.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
          <div class="admin-item-content">
            <h4>"${escapeHtml(truncate(d.text, 80))}"</h4>
            <p>${escapeHtml(d.author || '')} &mdash; ${escapeHtml(d.role || '')}</p>
          </div>
          <div class="admin-item-actions">
            <button class="btn btn-sm btn-outline" onclick="adminPanel.editTestimonial('${doc.id}')"><i class="fas fa-pen"></i></button>
            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteTestimonial('${doc.id}')"><i class="fas fa-trash"></i></button>
          </div>`;
        container.appendChild(item);
      });
    } catch (e) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading</h4><p>' + escapeHtml(e.message) + '</p></div>';
    }
  }

  function openTestimonialModal(data) {
    document.getElementById('testimonial-modal-title').textContent = data ? 'Edit Testimonial' : 'Add Testimonial';
    document.getElementById('testimonial-edit-id').value = data ? data._docId : '';
    document.getElementById('testimonial-text').value = data ? data.text : '';
    document.getElementById('testimonial-author').value = data ? data.author : '';
    document.getElementById('testimonial-role').value = data ? data.role : 'Parent';
    showModal('testimonial-modal');
  }

  async function saveTestimonial() {
    const docId = document.getElementById('testimonial-edit-id').value;
    const text = document.getElementById('testimonial-text').value.trim();
    const author = document.getElementById('testimonial-author').value.trim();

    if (!text || !author) {
      showToast('Text and author are required.', 'error');
      return;
    }

    const data = {
      text: text,
      author: author,
      role: document.getElementById('testimonial-role').value.trim() || 'Parent',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (docId) {
        await db.collection('testimonials').doc(docId).update(data);
      } else {
        // Get current count for ordering
        const snap = await db.collection('testimonials').get();
        data.order = snap.size;
        await db.collection('testimonials').add(data);
      }
      showToast('Testimonial saved!', 'success');
      closeModal('testimonial-modal');
      loadTestimonials();
      loadDashboard();
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  async function editTestimonial(docId) {
    try {
      const doc = await db.collection('testimonials').doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        data._docId = doc.id;
        openTestimonialModal(data);
      }
    } catch (e) {
      showToast('Error loading testimonial: ' + e.message, 'error');
    }
  }

  function deleteTestimonial(docId) {
    pendingDeleteFn = async () => {
      try {
        await db.collection('testimonials').doc(docId).delete();
        showToast('Testimonial deleted.', 'success');
        loadTestimonials();
        loadDashboard();
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    showModal('confirm-modal');
  }

  // ---- Services ----
  async function loadServices() {
    const container = document.getElementById('services-list');
    container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

    try {
      const snap = await db.collection('services').orderBy('order', 'asc').get();
      if (snap.empty) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-hand-holding-medical"></i><h4>No services yet</h4><p>Add your first service.</p></div>';
        return;
      }

      container.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
          <div style="width:48px;height:48px;border-radius:12px;background:#F3E8F3;color:#6B2D5B;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
            <i class="fas ${escapeHtml(d.icon || 'fa-cog')}"></i>
          </div>
          <div class="admin-item-content">
            <h4>${escapeHtml(d.title || '')}</h4>
            <p>${escapeHtml(truncate(d.short || d.description || '', 80))}</p>
          </div>
          <div class="admin-item-actions">
            <button class="btn btn-sm btn-outline" onclick="adminPanel.editService('${doc.id}')"><i class="fas fa-pen"></i></button>
            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteService('${doc.id}')"><i class="fas fa-trash"></i></button>
          </div>`;
        container.appendChild(item);
      });
    } catch (e) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading</h4><p>' + escapeHtml(e.message) + '</p></div>';
    }
  }

  function openServiceModal(data) {
    document.getElementById('service-modal-title').textContent = data ? 'Edit Service' : 'Add Service';
    document.getElementById('service-edit-id').value = data ? data._docId : '';
    document.getElementById('service-title').value = data ? data.title : '';
    document.getElementById('service-icon').value = data ? data.icon : '';
    document.getElementById('service-short').value = data ? data.short : '';
    document.getElementById('service-description').value = data ? data.description : '';

    // Populate features
    const featuresList = document.getElementById('service-features-list');
    featuresList.innerHTML = '';
    if (data && data.features) {
      data.features.forEach(f => addFeatureRow(f));
    } else {
      addFeatureRow('');
    }

    showModal('service-modal');
  }

  function addFeatureRow(value) {
    const list = document.getElementById('service-features-list');
    const row = document.createElement('div');
    row.className = 'feature-row';
    row.innerHTML = `
      <input type="text" class="form-control" value="${escapeHtml(value || '')}" placeholder="Feature name">
      <button type="button" title="Remove"><i class="fas fa-times"></i></button>`;
    row.querySelector('button').addEventListener('click', () => row.remove());
    list.appendChild(row);
  }

  function getFeatures() {
    return Array.from(document.querySelectorAll('#service-features-list .feature-row input'))
      .map(input => input.value.trim())
      .filter(v => v);
  }

  // ---- Dynamic List Editors (reusable) ----
  function populateListEditor(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    (items && items.length > 0 ? items : ['']).forEach(item => addListRow(containerId, item));
  }

  function addListRow(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'feature-row';
    row.innerHTML = `
      <input type="text" class="form-control" value="${escapeHtml(value || '')}" placeholder="Enter item...">
      <button type="button" title="Remove"><i class="fas fa-times"></i></button>`;
    row.querySelector('button').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  function getListValues(containerId) {
    return Array.from(document.querySelectorAll('#' + containerId + ' .feature-row input'))
      .map(input => input.value.trim())
      .filter(v => v);
  }

  // ---- Service Location Editor ----
  function populateServiceLocations(locations) {
    const container = document.getElementById('service-locations-list');
    if (!container) return;
    container.innerHTML = '';
    (locations || []).forEach(loc => addServiceLocationRow(loc));
  }

  function addServiceLocationRow(loc) {
    const container = document.getElementById('service-locations-list');
    if (!container) return;
    const row = document.createElement('div');
    row.style.cssText = 'padding:1rem;margin-bottom:0.75rem;border:1px solid #E8D8E8;border-radius:12px;background:#FDFAFE;';
    row.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Location Type</label>
          <input type="text" class="form-control svc-loc-type" value="${escapeHtml(loc ? loc.type || '' : '')}" placeholder="e.g., Virtual Services">
        </div>
        <div class="form-group">
          <label>Icon (Font Awesome)</label>
          <input type="text" class="form-control svc-loc-icon" value="${escapeHtml(loc ? loc.icon || '' : '')}" placeholder="e.g., fa-laptop-medical">
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="form-control svc-loc-desc" rows="2" placeholder="Description...">${escapeHtml(loc ? loc.description || '' : '')}</textarea>
      </div>
      <button type="button" class="btn btn-sm btn-danger" style="margin-top:0.25rem;"><i class="fas fa-trash"></i> Remove</button>`;
    row.querySelector('.btn-danger').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  function getServiceLocations() {
    return Array.from(document.querySelectorAll('#service-locations-list > div')).map(row => ({
      type: row.querySelector('.svc-loc-type').value.trim(),
      icon: row.querySelector('.svc-loc-icon').value.trim(),
      description: row.querySelector('.svc-loc-desc').value.trim(),
    })).filter(loc => loc.type);
  }

  async function saveService() {
    const docId = document.getElementById('service-edit-id').value;
    const title = document.getElementById('service-title').value.trim();

    if (!title) {
      showToast('Service title is required.', 'error');
      return;
    }

    const slug = docId || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const data = {
      id: slug,
      title: title,
      icon: document.getElementById('service-icon').value.trim() || 'fa-cog',
      short: document.getElementById('service-short').value.trim(),
      description: document.getElementById('service-description').value.trim(),
      features: getFeatures(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (docId) {
        await db.collection('services').doc(docId).update(data);
      } else {
        const snap = await db.collection('services').get();
        data.order = snap.size;
        await db.collection('services').doc(slug).set(data);
      }
      showToast('Service saved!', 'success');
      closeModal('service-modal');
      loadServices();
      loadDashboard();
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  async function editService(docId) {
    try {
      const doc = await db.collection('services').doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        data._docId = doc.id;
        openServiceModal(data);
      }
    } catch (e) {
      showToast('Error loading service: ' + e.message, 'error');
    }
  }

  function deleteService(docId) {
    pendingDeleteFn = async () => {
      try {
        await db.collection('services').doc(docId).delete();
        showToast('Service deleted.', 'success');
        loadServices();
        loadDashboard();
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    showModal('confirm-modal');
  }

  // ---- Homepage Content ----
  async function loadHomepage() {
    try {
      const doc = await db.collection('settings').doc('homepage').get();
      const data = doc.exists ? doc.data() : {};

      document.getElementById('homepage-subtitle').value = data.subtitle || SITE_CONFIG.subtitle || '';
      document.getElementById('homepage-hero-tagline').value = data.heroTagline || SITE_CONFIG.heroTagline || '';
      document.getElementById('homepage-hero-delivery').value = data.heroDelivery || SITE_CONFIG.heroDelivery || '';

      populateListEditor('differentiators-list', data.differentiators || SITE_CONFIG.differentiators || []);
      populateListEditor('who-we-help-list', data.whoWeHelp || SITE_CONFIG.whoWeHelp || []);
    } catch (e) {
      console.warn('Homepage load:', e.message);
    }
  }

  async function saveHomepage() {
    const data = {
      subtitle: document.getElementById('homepage-subtitle').value.trim(),
      heroTagline: document.getElementById('homepage-hero-tagline').value.trim(),
      heroDelivery: document.getElementById('homepage-hero-delivery').value.trim(),
      differentiators: getListValues('differentiators-list'),
      whoWeHelp: getListValues('who-we-help-list'),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('settings').doc('homepage').set(data);
      showToast('Homepage content saved!', 'success');
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  // ---- Services Page Extra Content ----
  async function loadServicesExtra() {
    try {
      const doc = await db.collection('settings').doc('servicesPage').get();
      const data = doc.exists ? doc.data() : {};

      populateListEditor('approach-list', data.approach || SITE_CONFIG.approach || []);
      populateListEditor('parent-expect-list', data.parentExpect || SITE_CONFIG.parentExpect || []);
    } catch (e) {
      console.warn('Services extra load:', e.message);
    }
  }

  async function saveServicesExtra() {
    const data = {
      approach: getListValues('approach-list'),
      parentExpect: getListValues('parent-expect-list'),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('settings').doc('servicesPage').set(data);
      showToast('Approach & expectations saved!', 'success');
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  // ---- About / Bio ----
  async function loadAbout() {
    try {
      const doc = await db.collection('settings').doc('about').get();
      const data = doc.exists ? doc.data() : SITE_CONFIG.about;

      document.getElementById('about-name').value = data.name || '';
      document.getElementById('about-credentials').value = data.credentials || '';
      document.getElementById('about-title').value = data.title || '';
      document.getElementById('about-bio').value = data.bio || '';
      document.getElementById('about-bio-extended').value = data.bioExtended || '';
      document.getElementById('about-specialties').value = data.specialties || '';
      document.getElementById('about-founding').value = data.founding || '';
      document.getElementById('about-mission').value = data.mission || '';
      document.getElementById('about-payment').value = data.paymentNote || '';
      document.getElementById('about-education').value = (data.education || []).join('\n');
      document.getElementById('about-certifications').value = (data.certifications || []).join('\n');

      // Show headshot
      const photoUrl = data.photo || '';
      if (photoUrl) {
        document.getElementById('headshot-preview-img').src = photoUrl;
        document.getElementById('headshot-preview').style.display = 'inline-block';
      }
    } catch (e) {
      console.warn('About load:', e.message);
    }
  }

  async function saveAbout() {
    const data = {
      name: document.getElementById('about-name').value.trim(),
      credentials: document.getElementById('about-credentials').value.trim(),
      title: document.getElementById('about-title').value.trim(),
      bio: document.getElementById('about-bio').value.trim(),
      bioExtended: document.getElementById('about-bio-extended').value.trim(),
      specialties: document.getElementById('about-specialties').value.trim(),
      founding: document.getElementById('about-founding').value.trim(),
      mission: document.getElementById('about-mission').value.trim(),
      paymentNote: document.getElementById('about-payment').value.trim(),
      education: document.getElementById('about-education').value.split('\n').map(s => s.trim()).filter(Boolean),
      certifications: document.getElementById('about-certifications').value.split('\n').map(s => s.trim()).filter(Boolean),
      photo: document.getElementById('headshot-preview-img').src || SITE_CONFIG.about.photo,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Upload headshot if file selected
    const fileInput = document.getElementById('headshot-file');
    if (fileInput.files.length > 0) {
      try {
        data.photo = await uploadImage(fileInput.files[0], 'about/headshot');
      } catch (e) {
        showToast('Headshot upload failed: ' + e.message, 'error');
      }
    }

    try {
      await db.collection('settings').doc('about').set(data);
      showToast('About info saved!', 'success');
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  // ---- Site Settings ----
  async function loadSettings() {
    try {
      const doc = await db.collection('settings').doc('general').get();
      const data = doc.exists ? doc.data() : SITE_CONFIG;

      document.getElementById('settings-site-name').value = data.siteName || SITE_CONFIG.siteName || '';
      document.getElementById('settings-tagline').value = data.tagline || SITE_CONFIG.tagline || '';
      document.getElementById('settings-phone').value = data.phone || '';
      document.getElementById('settings-fax').value = data.fax || '';
      document.getElementById('settings-email-primary').value = data.emailPrimary || '';
      document.getElementById('settings-email-secondary').value = data.emailSecondary || '';
      document.getElementById('settings-address').value = data.address || '';
      document.getElementById('settings-maps').value = data.googleMapsEmbed || '';

      const social = data.social || {};
      document.getElementById('settings-facebook').value = social.facebook || '';
      document.getElementById('settings-instagram').value = social.instagram || '';
      document.getElementById('settings-linkedin').value = social.linkedin || '';

      // Hours
      const hours = data.hours || SITE_CONFIG.hours;
      hours.forEach(h => {
        const input = document.querySelector(`#hours-editor input[data-day="${h.day}"]`);
        if (input) input.value = h.time || '';
      });

      // Service locations
      populateServiceLocations(data.serviceLocations || SITE_CONFIG.serviceLocations || []);

      // Service interests
      populateListEditor('service-interests-list', data.serviceInterests || SITE_CONFIG.serviceInterests || []);
    } catch (e) {
      console.warn('Settings load:', e.message);
    }
  }

  async function saveSettings() {
    const hours = [];
    document.querySelectorAll('#hours-editor .hours-row').forEach(row => {
      const input = row.querySelector('input');
      hours.push({ day: input.dataset.day, time: input.value.trim() });
    });

    const data = {
      siteName: document.getElementById('settings-site-name').value.trim(),
      tagline: document.getElementById('settings-tagline').value.trim(),
      phone: document.getElementById('settings-phone').value.trim(),
      fax: document.getElementById('settings-fax').value.trim(),
      emailPrimary: document.getElementById('settings-email-primary').value.trim(),
      emailSecondary: document.getElementById('settings-email-secondary').value.trim(),
      address: document.getElementById('settings-address').value.trim(),
      googleMapsEmbed: document.getElementById('settings-maps').value.trim(),
      social: {
        facebook: document.getElementById('settings-facebook').value.trim(),
        instagram: document.getElementById('settings-instagram').value.trim(),
        linkedin: document.getElementById('settings-linkedin').value.trim(),
      },
      hours: hours,
      serviceLocations: getServiceLocations(),
      serviceInterests: getListValues('service-interests-list'),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('settings').doc('general').set(data);
      showToast('Settings saved!', 'success');
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  // ---- Image Library ----
  async function loadImages() {
    const grid = document.getElementById('image-library-grid');
    grid.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

    try {
      const listResult = await storage.ref('images').listAll();
      if (listResult.items.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><h4>No images uploaded</h4><p>Upload images to use in blog posts and your site.</p></div>';
        return;
      }

      grid.innerHTML = '';
      for (const item of listResult.items) {
        const url = await item.getDownloadURL();
        const div = document.createElement('div');
        div.className = 'image-grid-item';
        div.innerHTML = `
          <img src="${url}" alt="${escapeHtml(item.name)}" loading="lazy">
          <div class="image-overlay">
            <button class="copy-url" title="Copy URL" onclick="adminPanel.copyImageUrl('${url}')"><i class="fas fa-link"></i></button>
            <button class="delete-image" title="Delete" onclick="adminPanel.deleteImage('${item.fullPath}')"><i class="fas fa-trash"></i></button>
          </div>`;
        grid.appendChild(div);
      }
    } catch (e) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h4>Error loading images</h4><p>' + escapeHtml(e.message) + '</p></div>';
    }
  }

  async function uploadLibraryImage(file) {
    const filename = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const ref = storage.ref('images/' + filename);
    const snap = await ref.put(file);
    return await snap.ref.getDownloadURL();
  }

  function copyImageUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Image URL copied!', 'success');
    });
  }

  function deleteImage(path) {
    pendingDeleteFn = async () => {
      try {
        await storage.ref(path).delete();
        showToast('Image deleted.', 'success');
        loadImages();
        loadDashboard();
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    showModal('confirm-modal');
  }

  // ---- Image Upload Helper ----
  async function uploadImage(file, path) {
    const ext = file.name.split('.').pop();
    const ref = storage.ref('images/' + path + '.' + ext);
    const snap = await ref.put(file);
    return await snap.ref.getDownloadURL();
  }

  // ---- Import from Config ----
  async function importFromConfig() {
    if (!confirm('This will import all content from config.js into Firebase. Existing Firebase data will be overwritten. Continue?')) return;

    showToast('Importing content...', 'success');

    try {
      const batch = db.batch();

      // Import settings (general)
      batch.set(db.collection('settings').doc('general'), {
        siteName: SITE_CONFIG.siteName,
        tagline: SITE_CONFIG.tagline,
        phone: SITE_CONFIG.phone,
        fax: SITE_CONFIG.fax,
        emailPrimary: SITE_CONFIG.emailPrimary,
        emailSecondary: SITE_CONFIG.emailSecondary,
        address: SITE_CONFIG.address,
        googleMapsEmbed: SITE_CONFIG.googleMapsEmbed,
        social: SITE_CONFIG.social,
        hours: SITE_CONFIG.hours,
        serviceLocations: SITE_CONFIG.serviceLocations,
        serviceInterests: SITE_CONFIG.serviceInterests,
        importedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Import about
      batch.set(db.collection('settings').doc('about'), {
        ...SITE_CONFIG.about,
        importedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Import homepage content
      batch.set(db.collection('settings').doc('homepage'), {
        subtitle: SITE_CONFIG.subtitle,
        heroTagline: SITE_CONFIG.heroTagline,
        heroDelivery: SITE_CONFIG.heroDelivery,
        differentiators: SITE_CONFIG.differentiators,
        whoWeHelp: SITE_CONFIG.whoWeHelp,
        importedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Import services page extras
      batch.set(db.collection('settings').doc('servicesPage'), {
        approach: SITE_CONFIG.approach,
        parentExpect: SITE_CONFIG.parentExpect,
        importedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      // Import blog posts (separate batch - Firestore limit is 500 per batch)
      for (const post of SITE_CONFIG.blogPosts) {
        await db.collection('blogPosts').doc(post.id).set({
          ...post,
          importedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Import testimonials
      for (let i = 0; i < SITE_CONFIG.testimonials.length; i++) {
        await db.collection('testimonials').add({
          ...SITE_CONFIG.testimonials[i],
          order: i,
          importedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Import services
      for (let i = 0; i < SITE_CONFIG.services.length; i++) {
        const svc = SITE_CONFIG.services[i];
        await db.collection('services').doc(svc.id).set({
          ...svc,
          order: i,
          importedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      showToast('Import complete! All content is now in Firebase.', 'success');
      loadDashboard();
    } catch (e) {
      showToast('Import failed: ' + e.message, 'error');
    }
  }

  // ---- Modal Helpers ----
  function showModal(id) {
    document.getElementById(id).classList.add('show');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    pendingDeleteFn = null;
  }

  function setupModals() {
    // Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });

    // Click outside to close
    document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('show');
      });
    });

    // Confirm delete
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
      if (pendingDeleteFn) {
        pendingDeleteFn();
        closeModal('confirm-modal');
      }
    });
  }

  // ---- Toast ----
  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'admin-toast ' + (type || '');
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ---- File Upload Setup ----
  function setupFileUploads() {
    // Blog image
    setupUploadZone('blog-image-upload', 'blog-image-file', 'blog-image-preview', 'blog-image-preview-img');
    document.getElementById('blog-image-remove').addEventListener('click', () => {
      document.getElementById('blog-image-preview').style.display = 'none';
      document.getElementById('blog-image-preview-img').src = '';
      document.getElementById('blog-image-file').value = '';
    });

    // Headshot
    setupUploadZone('headshot-upload', 'headshot-file', 'headshot-preview', 'headshot-preview-img');
    document.getElementById('headshot-remove').addEventListener('click', () => {
      document.getElementById('headshot-preview').style.display = 'none';
      document.getElementById('headshot-preview-img').src = '';
      document.getElementById('headshot-file').value = '';
    });

    // Image library
    const libraryZone = document.getElementById('library-upload-zone');
    const libraryInput = document.getElementById('library-file-input');

    libraryZone.addEventListener('click', () => libraryInput.click());
    libraryZone.addEventListener('dragover', (e) => { e.preventDefault(); libraryZone.classList.add('dragover'); });
    libraryZone.addEventListener('dragleave', () => libraryZone.classList.remove('dragover'));
    libraryZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      libraryZone.classList.remove('dragover');
      await handleLibraryFiles(e.dataTransfer.files);
    });
    libraryInput.addEventListener('change', async () => {
      await handleLibraryFiles(libraryInput.files);
      libraryInput.value = '';
    });
    document.getElementById('upload-image-btn').addEventListener('click', () => libraryInput.click());
  }

  function setupUploadZone(zoneId, inputId, previewId, imgId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const img = document.getElementById(imgId);

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        previewFile(input.files[0], preview, img);
      }
    });
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        previewFile(input.files[0], preview, img);
      }
    });
  }

  function previewFile(file, previewEl, imgEl) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imgEl.src = e.target.result;
      previewEl.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  }

  async function handleLibraryFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        showToast('Uploading ' + file.name + '...', 'success');
        await uploadLibraryImage(file);
      } catch (e) {
        showToast('Failed to upload ' + file.name + ': ' + e.message, 'error');
      }
    }
    showToast('Upload complete!', 'success');
    loadImages();
    loadDashboard();
  }

  // ---- Clinical Notes: Patients ----
  async function loadPatients() {
    const container = document.getElementById('patient-list');
    container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

    try {
      const snap = await db.collection('patients').orderBy('lastName', 'asc').get();
      patientsCache = [];
      snap.forEach(doc => {
        patientsCache.push({ id: doc.id, ...doc.data() });
      });
      renderPatients();
    } catch (e) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>' + escapeHtml(e.message) + '</p></div>';
    }
  }

  function renderPatients() {
    const container = document.getElementById('patient-list');
    const search = (document.getElementById('patient-search').value || '').toLowerCase();

    let list = patientsCache;

    // Filter by status
    if (patientFilter !== 'all') {
      list = list.filter(p => p.status === patientFilter);
    }

    // Filter by search
    if (search) {
      list = list.filter(p =>
        (p.firstName || '').toLowerCase().includes(search) ||
        (p.lastName || '').toLowerCase().includes(search) ||
        (p.guardianName || '').toLowerCase().includes(search)
      );
    }

    if (list.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:2rem 1rem;"><i class="fas fa-user" style="font-size:2rem;"></i><p style="font-size:0.85rem;">No patients found.</p></div>';
      return;
    }

    container.innerHTML = list.map(p => `
      <div class="notes-patient-item ${p.id === selectedPatientId ? 'active' : ''}" onclick="adminPanel.selectPatient('${p.id}')">
        <h4>${escapeHtml(p.lastName || '')}, ${escapeHtml(p.firstName || '')}</h4>
        <p>${p.diagnosis ? escapeHtml(truncate(p.diagnosis, 40)) : 'No diagnosis listed'}
          <span class="patient-status ${p.status || 'active'}">${p.status || 'active'}</span>
        </p>
      </div>
    `).join('');
  }

  function openPatientModal(data) {
    document.getElementById('patient-modal-title').textContent = data ? 'Edit Patient' : 'New Patient';
    document.getElementById('patient-edit-id').value = data ? data._docId : '';
    document.getElementById('patient-first-name').value = data ? data.firstName : '';
    document.getElementById('patient-last-name').value = data ? data.lastName : '';
    document.getElementById('patient-dob').value = data ? data.dateOfBirth : '';
    document.getElementById('patient-guardian').value = data ? data.guardianName : '';
    document.getElementById('patient-phone').value = data ? data.phone : '';
    document.getElementById('patient-email').value = data ? data.email : '';
    document.getElementById('patient-diagnosis').value = data ? data.diagnosis : '';
    document.getElementById('patient-status').value = data ? (data.status || 'active') : 'active';
    showModal('patient-modal');
  }

  async function savePatient() {
    const docId = document.getElementById('patient-edit-id').value;
    const firstName = document.getElementById('patient-first-name').value.trim();
    const lastName = document.getElementById('patient-last-name').value.trim();

    if (!firstName || !lastName) {
      showToast('First and last name are required.', 'error');
      return;
    }

    const data = {
      firstName: firstName,
      lastName: lastName,
      dateOfBirth: document.getElementById('patient-dob').value || '',
      guardianName: document.getElementById('patient-guardian').value.trim(),
      phone: document.getElementById('patient-phone').value.trim(),
      email: document.getElementById('patient-email').value.trim(),
      diagnosis: document.getElementById('patient-diagnosis').value.trim(),
      status: document.getElementById('patient-status').value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (docId) {
        await db.collection('patients').doc(docId).update(data);
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('patients').add(data);
      }
      showToast('Patient saved!', 'success');
      closeModal('patient-modal');
      loadPatients();
      loadDashboard();
    } catch (e) {
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  async function editPatient(docId) {
    try {
      const doc = await db.collection('patients').doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        data._docId = doc.id;
        openPatientModal(data);
      }
    } catch (e) {
      showToast('Error loading patient: ' + e.message, 'error');
    }
  }

  function deletePatient(docId) {
    pendingDeleteFn = async () => {
      try {
        // Delete all notes for this patient
        const notesSnap = await db.collection('clinicalNotes').where('patientId', '==', docId).get();
        const batch = db.batch();
        notesSnap.forEach(doc => batch.delete(doc.ref));
        batch.delete(db.collection('patients').doc(docId));
        await batch.commit();

        showToast('Patient and notes deleted.', 'success');
        if (selectedPatientId === docId) {
          selectedPatientId = null;
          selectedPatientData = null;
          document.getElementById('notes-content').style.display = 'none';
          document.getElementById('notes-empty').style.display = 'flex';
        }
        loadPatients();
        loadDashboard();
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    document.getElementById('confirm-message').textContent = 'Delete this patient and all their notes? This cannot be undone.';
    showModal('confirm-modal');
  }

  async function selectPatient(docId) {
    selectedPatientId = docId;

    // Find patient data from cache
    selectedPatientData = patientsCache.find(p => p.id === docId);
    if (!selectedPatientData) return;

    // Update sidebar selection
    renderPatients();

    // Show notes content area
    document.getElementById('notes-empty').style.display = 'none';
    document.getElementById('notes-content').style.display = 'block';

    // Render patient header
    const header = document.getElementById('notes-patient-header');
    const p = selectedPatientData;
    const details = [
      p.dateOfBirth ? 'DOB: ' + p.dateOfBirth : '',
      p.guardianName ? 'Guardian: ' + p.guardianName : '',
      p.diagnosis ? p.diagnosis : ''
    ].filter(Boolean).join(' &bull; ');

    header.innerHTML = `
      <div class="patient-info">
        <h3>${escapeHtml(p.firstName || '')} ${escapeHtml(p.lastName || '')}</h3>
        <p>${details || 'No additional details'}</p>
      </div>
      <div class="patient-actions">
        <button class="btn btn-sm btn-outline" onclick="adminPanel.editPatient('${docId}')"><i class="fas fa-pen"></i> Edit</button>
        <button class="btn btn-sm btn-danger" onclick="adminPanel.deletePatient('${docId}')"><i class="fas fa-trash"></i></button>
      </div>`;

    // Load notes for this patient
    loadNotes(docId);
  }

  // ---- Clinical Notes: Notes ----
  async function loadNotes(patientId) {
    const container = document.getElementById('notes-list');
    container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

    try {
      const snap = await db.collection('clinicalNotes')
        .where('patientId', '==', patientId)
        .orderBy('sessionDate', 'desc')
        .get();

      if (snap.empty) {
        container.innerHTML = '<div class="empty-state" style="padding:2rem;"><i class="fas fa-file-medical" style="font-size:2rem;"></i><h4>No notes yet</h4><p>Create a session note for this patient.</p></div>';
        return;
      }

      container.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const dateStr = d.sessionDate ? new Date(d.sessionDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
        const preview = d.noteType === 'SOAP'
          ? truncate((d.subjective || '') + ' ' + (d.objective || ''), 100)
          : truncate(d.narrative || '', 100);

        const card = document.createElement('div');
        card.className = 'note-card';
        card.onclick = () => adminPanel.editNote(doc.id);
        card.innerHTML = `
          <div class="note-card-header">
            <span class="note-date">${dateStr}${d.duration ? ' &mdash; ' + escapeHtml(d.duration) : ''}</span>
            <div class="note-meta">
              <span class="note-type-badge">${escapeHtml(d.noteType || 'SOAP')}</span>
              <span class="note-status-badge ${d.status || 'draft'}">${d.status || 'draft'}</span>
            </div>
          </div>
          <div class="note-preview">${escapeHtml(preview || 'Empty note')}</div>`;
        container.appendChild(card);
      });
    } catch (e) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>' + escapeHtml(e.message) + '</p></div>';
    }
  }

  function openNoteModal(data) {
    document.getElementById('note-modal-title').textContent = data ? 'Edit Note' : 'New Note';
    document.getElementById('note-edit-id').value = data ? data._docId : '';
    document.getElementById('note-patient-id').value = data ? data.patientId : selectedPatientId;
    document.getElementById('note-session-date').value = data ? data.sessionDate : new Date().toISOString().split('T')[0];
    document.getElementById('note-duration').value = data ? (data.duration || '') : '';
    document.getElementById('note-subjective').value = data ? (data.subjective || '') : '';
    document.getElementById('note-objective').value = data ? (data.objective || '') : '';
    document.getElementById('note-assessment').value = data ? (data.assessment || '') : '';
    document.getElementById('note-plan').value = data ? (data.plan || '') : '';
    document.getElementById('note-narrative').value = data ? (data.narrative || '') : '';

    // Set note type
    const noteType = data ? (data.noteType || 'SOAP') : 'SOAP';
    setNoteType(noteType);

    // Update finalize button
    const finalizeBtn = document.getElementById('finalize-note-btn');
    const isFinal = data && data.status === 'final';
    finalizeBtn.textContent = isFinal ? ' Finalized' : ' Mark as Final';
    finalizeBtn.innerHTML = isFinal
      ? '<i class="fas fa-lock"></i> Finalized'
      : '<i class="fas fa-check-circle"></i> Mark as Final';
    finalizeBtn.disabled = isFinal;

    // Show/hide delete button
    document.getElementById('delete-note-btn').style.display = data ? '' : 'none';

    // Clear save indicator
    updateSaveIndicator('');

    showModal('note-modal');

    // Setup autosave listeners
    setupNoteAutoSave();
  }

  function setNoteType(type) {
    document.querySelectorAll('#note-type-selector .btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.noteType === type);
    });
    document.getElementById('soap-fields').style.display = type === 'SOAP' ? 'block' : 'none';
    document.getElementById('narrative-fields').style.display = type !== 'SOAP' ? 'block' : 'none';
  }

  function getSelectedNoteType() {
    const activeBtn = document.querySelector('#note-type-selector .btn.active');
    return activeBtn ? activeBtn.dataset.noteType : 'SOAP';
  }

  function getNoteData() {
    return {
      patientId: document.getElementById('note-patient-id').value,
      sessionDate: document.getElementById('note-session-date').value,
      noteType: getSelectedNoteType(),
      subjective: document.getElementById('note-subjective').value.trim(),
      objective: document.getElementById('note-objective').value.trim(),
      assessment: document.getElementById('note-assessment').value.trim(),
      plan: document.getElementById('note-plan').value.trim(),
      narrative: document.getElementById('note-narrative').value.trim(),
      duration: document.getElementById('note-duration').value.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
  }

  async function saveNote() {
    const docId = document.getElementById('note-edit-id').value;
    const data = getNoteData();

    if (!data.sessionDate) {
      showToast('Session date is required.', 'error');
      return;
    }

    try {
      if (docId) {
        await db.collection('clinicalNotes').doc(docId).update(data);
      } else {
        data.status = 'draft';
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const ref = await db.collection('clinicalNotes').add(data);
        document.getElementById('note-edit-id').value = ref.id;
      }
      updateSaveIndicator('saved');
      showToast('Note saved!', 'success');
    } catch (e) {
      updateSaveIndicator('error');
      showToast('Save failed: ' + e.message, 'error');
    }
  }

  function setupNoteAutoSave() {
    // Remove existing listeners by cloning (to avoid duplicates)
    document.querySelectorAll('.note-autosave').forEach(el => {
      el.addEventListener('input', handleNoteInput);
    });
    // Also autosave on date/duration changes
    document.getElementById('note-session-date').addEventListener('change', handleNoteInput);
    document.getElementById('note-duration').addEventListener('input', handleNoteInput);
  }

  function handleNoteInput() {
    clearTimeout(noteAutoSaveTimer);
    updateSaveIndicator('saving');
    noteAutoSaveTimer = setTimeout(autoSaveNote, 2000);
  }

  async function autoSaveNote() {
    const docId = document.getElementById('note-edit-id').value;
    const data = getNoteData();

    if (!data.sessionDate || !data.patientId) return;

    try {
      if (docId) {
        await db.collection('clinicalNotes').doc(docId).update(data);
      } else {
        data.status = 'draft';
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const ref = await db.collection('clinicalNotes').add(data);
        document.getElementById('note-edit-id').value = ref.id;
      }
      updateSaveIndicator('saved');
    } catch (e) {
      updateSaveIndicator('error');
    }
  }

  function updateSaveIndicator(state) {
    const el = document.getElementById('note-save-indicator');
    el.className = 'save-indicator';
    if (state === 'saving') {
      el.className = 'save-indicator saving';
      el.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';
    } else if (state === 'saved') {
      el.className = 'save-indicator saved';
      el.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
    } else if (state === 'error') {
      el.className = 'save-indicator error';
      el.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error';
    } else {
      el.innerHTML = '';
    }
  }

  async function editNote(docId) {
    try {
      const doc = await db.collection('clinicalNotes').doc(docId).get();
      if (doc.exists) {
        const data = doc.data();
        data._docId = doc.id;
        openNoteModal(data);
      }
    } catch (e) {
      showToast('Error loading note: ' + e.message, 'error');
    }
  }

  function deleteNote(docId) {
    if (!docId) {
      closeModal('note-modal');
      return;
    }
    pendingDeleteFn = async () => {
      try {
        await db.collection('clinicalNotes').doc(docId).delete();
        showToast('Note deleted.', 'success');
        closeModal('note-modal');
        if (selectedPatientId) loadNotes(selectedPatientId);
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    document.getElementById('confirm-message').textContent = 'Delete this clinical note? This cannot be undone.';
    showModal('confirm-modal');
  }

  async function markNoteFinal() {
    const docId = document.getElementById('note-edit-id').value;
    if (!docId) {
      // Save first if new note
      await saveNote();
      const newDocId = document.getElementById('note-edit-id').value;
      if (!newDocId) return;
      await db.collection('clinicalNotes').doc(newDocId).update({ status: 'final' });
    } else {
      // Save current state then finalize
      const data = getNoteData();
      data.status = 'final';
      await db.collection('clinicalNotes').doc(docId).update(data);
    }

    showToast('Note marked as final.', 'success');
    const finalizeBtn = document.getElementById('finalize-note-btn');
    finalizeBtn.innerHTML = '<i class="fas fa-lock"></i> Finalized';
    finalizeBtn.disabled = true;

    if (selectedPatientId) loadNotes(selectedPatientId);
  }

  function emailNote() {
    const patientName = selectedPatientData
      ? (selectedPatientData.firstName + ' ' + selectedPatientData.lastName)
      : 'Patient';
    const sessionDate = document.getElementById('note-session-date').value || 'No date';
    const noteType = getSelectedNoteType();

    const subject = encodeURIComponent('Clinical Note - ' + patientName + ' - ' + sessionDate);
    let body = '';

    if (noteType === 'SOAP') {
      const s = document.getElementById('note-subjective').value.trim();
      const o = document.getElementById('note-objective').value.trim();
      const a = document.getElementById('note-assessment').value.trim();
      const p = document.getElementById('note-plan').value.trim();

      body = 'CLINICAL NOTE\n'
        + 'Patient: ' + patientName + '\n'
        + 'Date: ' + sessionDate + '\n'
        + 'Duration: ' + (document.getElementById('note-duration').value.trim() || 'N/A') + '\n'
        + 'Type: SOAP\n\n'
        + '--- SUBJECTIVE ---\n' + (s || 'N/A') + '\n\n'
        + '--- OBJECTIVE ---\n' + (o || 'N/A') + '\n\n'
        + '--- ASSESSMENT ---\n' + (a || 'N/A') + '\n\n'
        + '--- PLAN ---\n' + (p || 'N/A') + '\n';
    } else {
      const n = document.getElementById('note-narrative').value.trim();
      body = 'CLINICAL NOTE\n'
        + 'Patient: ' + patientName + '\n'
        + 'Date: ' + sessionDate + '\n'
        + 'Duration: ' + (document.getElementById('note-duration').value.trim() || 'N/A') + '\n'
        + 'Type: ' + noteType + '\n\n'
        + (n || 'N/A') + '\n';
    }

    window.location.href = 'mailto:?subject=' + subject + '&body=' + encodeURIComponent(body);
  }

  // ---- Utilities ----
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  // ---- Wire Up Event Listeners ----
  function setupEventListeners() {
    document.getElementById('add-blog-btn').addEventListener('click', () => openBlogModal(null));
    document.getElementById('save-blog-btn').addEventListener('click', saveBlogPost);

    document.getElementById('add-testimonial-btn').addEventListener('click', () => openTestimonialModal(null));
    document.getElementById('save-testimonial-btn').addEventListener('click', saveTestimonial);

    document.getElementById('add-service-btn').addEventListener('click', () => openServiceModal(null));
    document.getElementById('save-service-btn').addEventListener('click', saveService);
    document.getElementById('add-feature-btn').addEventListener('click', () => addFeatureRow(''));

    document.getElementById('save-about-btn').addEventListener('click', saveAbout);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('import-config-btn').addEventListener('click', importFromConfig);

    // Homepage
    document.getElementById('save-homepage-btn').addEventListener('click', saveHomepage);
    document.getElementById('add-differentiator-btn').addEventListener('click', () => addListRow('differentiators-list', ''));
    document.getElementById('add-who-we-help-btn').addEventListener('click', () => addListRow('who-we-help-list', ''));

    // Services page extras
    document.getElementById('save-services-extra-btn').addEventListener('click', saveServicesExtra);
    document.getElementById('add-approach-btn').addEventListener('click', () => addListRow('approach-list', ''));
    document.getElementById('add-parent-expect-btn').addEventListener('click', () => addListRow('parent-expect-list', ''));

    // Settings extras
    document.getElementById('add-service-location-btn').addEventListener('click', () => addServiceLocationRow(null));
    document.getElementById('add-service-interest-btn').addEventListener('click', () => addListRow('service-interests-list', ''));

    // Clinical Notes
    document.getElementById('add-patient-btn').addEventListener('click', () => openPatientModal(null));
    document.getElementById('save-patient-btn').addEventListener('click', savePatient);
    document.getElementById('add-note-btn').addEventListener('click', () => openNoteModal(null));
    document.getElementById('save-note-btn').addEventListener('click', saveNote);
    document.getElementById('delete-note-btn').addEventListener('click', () => {
      deleteNote(document.getElementById('note-edit-id').value);
    });
    document.getElementById('finalize-note-btn').addEventListener('click', markNoteFinal);
    document.getElementById('email-note-btn').addEventListener('click', emailNote);

    // Patient search
    document.getElementById('patient-search').addEventListener('input', renderPatients);

    // Patient filter buttons
    document.querySelectorAll('[data-patient-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-patient-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        patientFilter = btn.dataset.patientFilter;
        renderPatients();
      });
    });

    // Note type selector
    document.querySelectorAll('#note-type-selector .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setNoteType(btn.dataset.noteType);
        handleNoteInput();
      });
    });

    // Close note modal → refresh notes list
    const noteModalOverlay = document.getElementById('note-modal');
    const origCloseHandler = noteModalOverlay.querySelector('[data-close-modal="note-modal"]');
    if (origCloseHandler) {
      origCloseHandler.addEventListener('click', () => {
        clearTimeout(noteAutoSaveTimer);
        if (selectedPatientId) loadNotes(selectedPatientId);
      });
    }
  }

  // ---- Boot ----
  document.addEventListener('DOMContentLoaded', () => {
    if (!initFirebase()) return;
    setupAuth();
    setupNavigation();
    setupModals();
    setupFileUploads();
    setupEventListeners();
  });

  // ---- Public API (for inline onclick handlers) ----
  window.adminPanel = {
    editBlog,
    deleteBlog,
    editTestimonial,
    deleteTestimonial,
    editService,
    deleteService,
    copyImageUrl,
    deleteImage,
    selectPatient,
    editPatient,
    deletePatient,
    editNote,
    deleteNote,
    emailNote
  };

})();
