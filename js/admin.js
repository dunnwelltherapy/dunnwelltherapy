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

  // Page Editor state
  let currentEditorPage = null;

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
      case 'testimonials': loadTestimonials(); loadVideoTestimonials(); break;
      case 'services': loadServices(); loadServicesExtra(); break;
      case 'about': loadAbout(); break;
      case 'settings': loadSettings(); break;
      case 'pages': loadPageEditor(); break;
      case 'theme': loadTheme(); break;
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
      refreshCollectionZones();
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
        await trackDeletion('blogPosts', docId);
        showToast('Blog post deleted.', 'success');
        loadBlogPosts();
        loadDashboard();
        refreshCollectionZones();
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
      refreshCollectionZones();
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
        // Get author before deleting so we can track it
        var snap = await db.collection('testimonials').doc(docId).get();
        var author = snap.exists ? (snap.data().author || '') : '';
        await db.collection('testimonials').doc(docId).delete();
        if (author) await trackDeletion('testimonials', author);
        showToast('Testimonial deleted.', 'success');
        loadTestimonials();
        loadDashboard();
        refreshCollectionZones();
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    showModal('confirm-modal');
  }

  // ---- Video Testimonials ----
  async function loadVideoTestimonials() {
    const container = document.getElementById('video-testimonials-list');
    if (!container) return;
    container.innerHTML = '<div class="admin-loading"><div class="admin-spinner"></div></div>';

    try {
      let snap = await db.collection('videoTestimonials').get();

      // Seed existing videos on first load if collection is empty
      if (snap.empty) {
        const seedVideos = [
          { url: 'images/testimonial-video.mp4', label: 'Video Testimonial 1', order: 0 },
          { url: 'images/testimonial-video-2.mp4', label: 'Video Testimonial 2', order: 1 }
        ];
        for (const v of seedVideos) {
          v.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('videoTestimonials').add(v);
        }
        snap = await db.collection('videoTestimonials').get();
      }

      const videos = [];
      snap.forEach(doc => videos.push({ id: doc.id, ...doc.data() }));
      videos.sort((a, b) => (a.order || 0) - (b.order || 0));

      if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:1.5rem;"><i class="fas fa-video" style="font-size:2rem;"></i><p style="font-size:0.85rem;">No video testimonials yet.</p></div>';
        return;
      }

      container.innerHTML = '';
      videos.forEach(v => {
        const item = document.createElement('div');
        item.className = 'video-testimonial-item';
        item.innerHTML = `
          <video preload="metadata">
            <source src="${escapeHtml(v.url)}" type="video/mp4">
          </video>
          <div class="video-info">
            <p class="video-label">${escapeHtml(v.label || 'Video Testimonial')}</p>
            <p>${escapeHtml(truncate(v.url, 60))}</p>
          </div>
          <div class="admin-item-actions">
            <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteVideoTestimonial('${v.id}')"><i class="fas fa-trash"></i></button>
          </div>`;
        container.appendChild(item);
      });
    } catch (e) {
      container.innerHTML = '<div class="empty-state"><p>' + escapeHtml(e.message) + '</p></div>';
    }
  }

  async function addVideoTestimonialByUrl() {
    const url = prompt('Enter the video URL (e.g., images/my-video.mp4 or https://...):');
    if (!url || !url.trim()) return;

    const label = prompt('Enter a label for this video (optional):', 'Video Testimonial') || 'Video Testimonial';

    try {
      const snap = await db.collection('videoTestimonials').get();
      await db.collection('videoTestimonials').add({
        url: url.trim(),
        label: label.trim(),
        order: snap.size,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('Video testimonial added!', 'success');
      loadVideoTestimonials();
    } catch (e) {
      showToast('Failed to add video: ' + e.message, 'error');
    }
  }

  async function uploadVideoTestimonial(file) {
    if (!file || !file.type.startsWith('video/')) {
      showToast('Please select a video file.', 'error');
      return;
    }

    // Check file size (50MB limit for free hosting)
    if (file.size > 50 * 1024 * 1024) {
      showToast('Video must be under 50MB.', 'error');
      return;
    }

    const label = prompt('Enter a label for this video (optional):', 'Video Testimonial') || 'Video Testimonial';

    // Generate a filename
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = 'testimonial-video-' + Date.now() + '.' + ext;
    const filePath = 'images/' + filename;

    // Try Firebase Storage first (if available on Blaze plan)
    try {
      const ref = storage.ref(filePath);
      showToast('Uploading video...', 'success');
      const snapshot = await ref.put(file);
      const downloadUrl = await snapshot.ref.getDownloadURL();

      const snap = await db.collection('videoTestimonials').get();
      await db.collection('videoTestimonials').add({
        url: downloadUrl,
        label: label.trim(),
        order: snap.size,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('Video uploaded and added!', 'success');
      loadVideoTestimonials();
    } catch (e) {
      // Firebase Storage may not be available (Spark plan)
      // Fall back to telling the user to add the file manually
      showToast('Storage upload not available. Add the video file to images/ folder and use "Add by URL" with the path.', 'error');
    }
  }

  function deleteVideoTestimonial(docId) {
    pendingDeleteFn = async () => {
      try {
        var snap = await db.collection('videoTestimonials').doc(docId).get();
        var url = snap.exists ? (snap.data().url || '') : '';
        await db.collection('videoTestimonials').doc(docId).delete();
        if (url) await trackDeletion('videoTestimonials', url);
        showToast('Video testimonial removed.', 'success');
        loadVideoTestimonials();
      } catch (e) {
        showToast('Delete failed: ' + e.message, 'error');
      }
    };
    document.getElementById('confirm-message').textContent = 'Remove this video testimonial?';
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
      refreshCollectionZones();
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
        await trackDeletion('services', docId);
        showToast('Service deleted.', 'success');
        loadServices();
        loadDashboard();
        refreshCollectionZones();
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
  // ---- Deletion Tracking ----
  // Records deleted item identifiers so Import from Config won't bring them back
  async function trackDeletion(collection, identifier) {
    try {
      await db.doc('settings/deletedItems').set({
        [collection]: firebase.firestore.FieldValue.arrayUnion(identifier)
      }, { merge: true });
    } catch (e) {
      console.warn('Could not track deletion:', e.message);
    }
  }

  async function getDeletedItems() {
    try {
      var snap = await db.doc('settings/deletedItems').get();
      return snap.exists ? snap.data() : {};
    } catch (e) {
      return {};
    }
  }

  async function importFromConfig() {
    if (!confirm('This will import content from config.js into Firebase. Items you previously deleted will be skipped. Continue?')) return;

    showToast('Importing content...', 'success');

    try {
      // Load the deleted items list so we skip them
      var deleted = await getDeletedItems();
      var deletedBlogs = deleted.blogPosts || [];
      var deletedServices = deleted.services || [];
      var deletedTestimonials = deleted.testimonials || [];

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

      // Import blog posts — skip deleted ones
      var blogSkipped = 0;
      for (const post of SITE_CONFIG.blogPosts) {
        if (deletedBlogs.indexOf(post.id) !== -1) { blogSkipped++; continue; }
        await db.collection('blogPosts').doc(post.id).set({
          ...post,
          importedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Import testimonials — skip deleted, skip duplicates
      var existingTestimonials = await db.collection('testimonials').get();
      var existingAuthors = {};
      existingTestimonials.forEach(function (doc) {
        var a = doc.data().author;
        if (a) existingAuthors[a] = true;
      });
      var testimSkipped = 0;
      for (let i = 0; i < SITE_CONFIG.testimonials.length; i++) {
        var t = SITE_CONFIG.testimonials[i];
        if (deletedTestimonials.indexOf(t.author) !== -1) { testimSkipped++; continue; }
        if (existingAuthors[t.author]) { testimSkipped++; continue; }
        await db.collection('testimonials').add({
          ...t,
          order: i,
          importedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Import services — skip deleted ones
      var svcSkipped = 0;
      for (let i = 0; i < SITE_CONFIG.services.length; i++) {
        const svc = SITE_CONFIG.services[i];
        if (deletedServices.indexOf(svc.id) !== -1) { svcSkipped++; continue; }
        await db.collection('services').doc(svc.id).set({
          ...svc,
          order: i,
          importedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      var totalSkipped = blogSkipped + testimSkipped + svcSkipped;
      var msg = 'Import complete!';
      if (totalSkipped > 0) msg += ' (' + totalSkipped + ' previously deleted item' + (totalSkipped > 1 ? 's' : '') + ' skipped)';
      showToast(msg, 'success');
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
      const snap = await db.collection('patients').get();
      patientsCache = [];
      snap.forEach(doc => {
        patientsCache.push({ id: doc.id, ...doc.data() });
      });
      patientsCache.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
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
        .get();

      if (snap.empty) {
        container.innerHTML = '<div class="empty-state" style="padding:2rem;"><i class="fas fa-file-medical" style="font-size:2rem;"></i><h4>No notes yet</h4><p>Create a session note for this patient.</p></div>';
        return;
      }

      // Sort client-side to avoid needing a composite index
      const notes = [];
      snap.forEach(doc => { notes.push({ id: doc.id, ...doc.data() }); });
      notes.sort((a, b) => (b.sessionDate || '').localeCompare(a.sessionDate || ''));

      container.innerHTML = '';
      notes.forEach(d => {
        const dateStr = d.sessionDate ? new Date(d.sessionDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
        const preview = d.noteType === 'SOAP'
          ? truncate((d.subjective || '') + ' ' + (d.objective || ''), 100)
          : truncate(d.narrative || '', 100);

        const card = document.createElement('div');
        card.className = 'note-card';
        card.onclick = () => adminPanel.editNote(d.id);
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

  // ---- Theme & Colors ----
  const THEME_DEFAULTS = {
    plum: '#6B2D5B',
    plumDeep: '#4A1A3A',
    plumLight: '#9B5F8B',
    mauve: '#C9A0C9',
    bgWarm: '#FDF8FC',
    lavender: '#F3E8F3',
    bgCream: '#FAF7F5',
    textDark: '#2D1B2E',
    textBody: '#4A3A4B',
    heroBgImage: '',
    radiusSm: '10',
    radiusMd: '16',
    radiusLg: '24',
    radiusXl: '32',
    borderColor: '#E4D0E4',
    borderWidth: '0',
    heroBorder: '0',
    pageHeroBorder: '0',
    ctaBorder: '0',
    footerBorder: '0',
    sectionBorderColor: '#C9A0C9',
    sectionRadius: '0'
  };

  // Map theme keys to admin input IDs (without 'theme-' prefix for Firestore keys)
  const THEME_FIELDS = [
    { key: 'plum',      inputId: 'theme-plum',       hexId: 'theme-plum-hex',       swatchId: 'swatch-primary' },
    { key: 'plumDeep',  inputId: 'theme-plum-deep',  hexId: 'theme-plum-deep-hex',  swatchId: 'swatch-primary-dark' },
    { key: 'plumLight', inputId: 'theme-plum-light', hexId: 'theme-plum-light-hex', swatchId: 'swatch-accent' },
    { key: 'mauve',     inputId: 'theme-mauve',      hexId: 'theme-mauve-hex',      swatchId: null },
    { key: 'bgWarm',    inputId: 'theme-bg-warm',    hexId: 'theme-bg-warm-hex',    swatchId: 'swatch-bg' },
    { key: 'lavender',  inputId: 'theme-lavender',   hexId: 'theme-lavender-hex',   swatchId: null },
    { key: 'bgCream',   inputId: 'theme-bg-cream',   hexId: 'theme-bg-cream-hex',   swatchId: null },
    { key: 'textDark',  inputId: 'theme-text-dark',  hexId: 'theme-text-dark-hex',  swatchId: 'swatch-text' },
    { key: 'textBody',  inputId: 'theme-text-body',  hexId: 'theme-text-body-hex',  swatchId: null }
  ];

  // Border / radius fields (range sliders + value inputs)
  const BORDER_FIELDS = [
    { key: 'radiusSm', sliderId: 'theme-radius-sm', valId: 'theme-radius-sm-val', unit: 'px' },
    { key: 'radiusMd', sliderId: 'theme-radius-md', valId: 'theme-radius-md-val', unit: 'px' },
    { key: 'radiusLg', sliderId: 'theme-radius-lg', valId: 'theme-radius-lg-val', unit: 'px' },
    { key: 'radiusXl', sliderId: 'theme-radius-xl', valId: 'theme-radius-xl-val', unit: 'px' },
    { key: 'borderWidth', sliderId: 'theme-border-width', valId: 'theme-border-width-val', unit: 'px' },
    { key: 'heroBorder', sliderId: 'theme-hero-border', valId: 'theme-hero-border-val', unit: 'px' },
    { key: 'pageHeroBorder', sliderId: 'theme-page-hero-border', valId: 'theme-page-hero-border-val', unit: 'px' },
    { key: 'ctaBorder', sliderId: 'theme-cta-border', valId: 'theme-cta-border-val', unit: 'px' },
    { key: 'footerBorder', sliderId: 'theme-footer-border', valId: 'theme-footer-border-val', unit: 'px' },
    { key: 'sectionRadius', sliderId: 'theme-section-radius', valId: 'theme-section-radius-val', unit: 'px' }
  ];
  const BORDER_COLOR_FIELD = { key: 'borderColor', inputId: 'theme-border-color', hexId: 'theme-border-color-hex' };
  const SECTION_BORDER_COLOR_FIELD = { key: 'sectionBorderColor', inputId: 'theme-section-border-color', hexId: 'theme-section-border-color-hex' };

  async function loadTheme() {
    try {
      const snap = await db.doc('settings/theme').get();
      const data = snap.exists ? snap.data() : {};
      THEME_FIELDS.forEach(function (f) {
        var val = data[f.key] || THEME_DEFAULTS[f.key];
        var colorInput = document.getElementById(f.inputId);
        var hexInput = document.getElementById(f.hexId);
        if (colorInput) colorInput.value = val;
        if (hexInput) hexInput.value = val.toUpperCase();
        if (f.swatchId) {
          var sw = document.getElementById(f.swatchId);
          if (sw) sw.style.background = val;
        }
      });
      // Border / radius fields
      BORDER_FIELDS.forEach(function (f) {
        var val = data[f.key] !== undefined ? data[f.key] : THEME_DEFAULTS[f.key];
        var slider = document.getElementById(f.sliderId);
        var valInput = document.getElementById(f.valId);
        if (slider) slider.value = val;
        if (valInput) valInput.value = val + f.unit;
      });
      // Border color
      [BORDER_COLOR_FIELD, SECTION_BORDER_COLOR_FIELD].forEach(function (cf) {
        var val = data[cf.key] || THEME_DEFAULTS[cf.key];
        var colorEl = document.getElementById(cf.inputId);
        var hexEl = document.getElementById(cf.hexId);
        if (colorEl) colorEl.value = val;
        if (hexEl) hexEl.value = val.toUpperCase();
      });

      // Hero bg image
      var heroBg = data.heroBgImage || '';
      var previewEl = document.getElementById('hero-bg-preview');
      var previewImg = document.getElementById('hero-bg-preview-img');
      if (heroBg && previewEl && previewImg) {
        previewImg.src = heroBg;
        previewEl.style.display = 'inline-block';
      } else if (previewEl) {
        previewEl.style.display = 'none';
      }
    } catch (err) {
      console.error('Theme load error:', err);
      showToast('Error loading theme', 'error');
    }
  }

  async function saveTheme() {
    try {
      var data = {};
      THEME_FIELDS.forEach(function (f) {
        var hexInput = document.getElementById(f.hexId);
        if (hexInput) data[f.key] = hexInput.value.trim();
      });
      // Border / radius fields
      BORDER_FIELDS.forEach(function (f) {
        var slider = document.getElementById(f.sliderId);
        if (slider) data[f.key] = slider.value;
      });
      // Border colors
      [BORDER_COLOR_FIELD, SECTION_BORDER_COLOR_FIELD].forEach(function (cf) {
        var hexEl = document.getElementById(cf.hexId);
        if (hexEl) data[cf.key] = hexEl.value.trim();
      });

      // Upload hero bg if file selected
      var fileInput = document.getElementById('hero-bg-file');
      if (fileInput && fileInput.files.length > 0) {
        showToast('Uploading hero background...', 'info');
        var url = await uploadImage(fileInput.files[0], 'hero-bg');
        data.heroBgImage = url;
      } else {
        // Keep existing image URL
        var previewImg = document.getElementById('hero-bg-preview-img');
        if (previewImg && previewImg.src && previewImg.src !== window.location.href) {
          data.heroBgImage = previewImg.src;
        } else {
          data.heroBgImage = '';
        }
      }
      await db.doc('settings/theme').set(data);
      showToast('Theme saved! Changes appear on the live site immediately.', 'success');
    } catch (err) {
      console.error('Theme save error:', err);
      showToast('Error saving theme: ' + err.message, 'error');
    }
  }

  function resetTheme() {
    THEME_FIELDS.forEach(function (f) {
      var val = THEME_DEFAULTS[f.key];
      var colorInput = document.getElementById(f.inputId);
      var hexInput = document.getElementById(f.hexId);
      if (colorInput) colorInput.value = val;
      if (hexInput) hexInput.value = val.toUpperCase();
      if (f.swatchId) {
        var sw = document.getElementById(f.swatchId);
        if (sw) sw.style.background = val;
      }
    });
    // Reset border / radius fields
    BORDER_FIELDS.forEach(function (f) {
      var val = THEME_DEFAULTS[f.key];
      var slider = document.getElementById(f.sliderId);
      var valInput = document.getElementById(f.valId);
      if (slider) slider.value = val;
      if (valInput) valInput.value = val + f.unit;
    });
    [BORDER_COLOR_FIELD, SECTION_BORDER_COLOR_FIELD].forEach(function (cf) {
      var val = THEME_DEFAULTS[cf.key];
      var colorEl = document.getElementById(cf.inputId);
      var hexEl = document.getElementById(cf.hexId);
      if (colorEl) colorEl.value = val;
      if (hexEl) hexEl.value = val.toUpperCase();
    });

    // Clear hero bg
    var previewEl = document.getElementById('hero-bg-preview');
    if (previewEl) previewEl.style.display = 'none';
    var fileInput = document.getElementById('hero-bg-file');
    if (fileInput) fileInput.value = '';
    showToast('Defaults restored. Click Save Theme to apply.', 'info');
  }

  function setupThemeColorSync() {
    THEME_FIELDS.forEach(function (f) {
      var colorInput = document.getElementById(f.inputId);
      var hexInput = document.getElementById(f.hexId);
      if (!colorInput || !hexInput) return;
      // Color picker → hex field + swatch
      colorInput.addEventListener('input', function () {
        hexInput.value = colorInput.value.toUpperCase();
        if (f.swatchId) {
          var sw = document.getElementById(f.swatchId);
          if (sw) sw.style.background = colorInput.value;
        }
      });
      // Hex field → color picker + swatch
      hexInput.addEventListener('input', function () {
        var v = hexInput.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
          colorInput.value = v;
          if (f.swatchId) {
            var sw = document.getElementById(f.swatchId);
            if (sw) sw.style.background = v;
          }
        }
      });
    });
    // Border / radius slider sync
    BORDER_FIELDS.forEach(function (f) {
      var slider = document.getElementById(f.sliderId);
      var valInput = document.getElementById(f.valId);
      if (!slider || !valInput) return;
      slider.addEventListener('input', function () {
        valInput.value = slider.value + f.unit;
      });
      valInput.addEventListener('change', function () {
        var num = parseFloat(valInput.value);
        if (!isNaN(num)) {
          slider.value = num;
          valInput.value = num + f.unit;
        }
      });
    });
    // Border color sync
    [BORDER_COLOR_FIELD, SECTION_BORDER_COLOR_FIELD].forEach(function (cf) {
      var colorEl = document.getElementById(cf.inputId);
      var hexEl = document.getElementById(cf.hexId);
      if (!colorEl || !hexEl) return;
      colorEl.addEventListener('input', function () { hexEl.value = colorEl.value.toUpperCase(); });
      hexEl.addEventListener('input', function () {
        if (/^#[0-9A-Fa-f]{6}$/.test(hexEl.value.trim())) colorEl.value = hexEl.value.trim();
      });
    });

    // Hero bg upload zone
    setupUploadZone('hero-bg-upload', 'hero-bg-file', 'hero-bg-preview', 'hero-bg-preview-img');
    // Hero bg remove
    var removeBtn = document.getElementById('hero-bg-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        document.getElementById('hero-bg-preview').style.display = 'none';
        document.getElementById('hero-bg-preview-img').src = '';
        document.getElementById('hero-bg-file').value = '';
      });
    }
  }

  // ---- Page Editor ----
  const PAGE_META = {
    global:   { label: 'Global Elements', icon: 'fa-globe',              url: 'index.html',    color: '#4A4A6A' },
    home:     { label: 'Home Page',        icon: 'fa-home',               url: 'index.html',    color: '#6B2D5B' },
    about:    { label: 'About Page',       icon: 'fa-user',               url: 'about.html',    color: '#8B5E7D' },
    services: { label: 'Services Page',    icon: 'fa-hand-holding-medical', url: 'services.html', color: '#5B7D6B' },
    contact:  { label: 'Contact Page',     icon: 'fa-envelope',           url: 'contact.html',  color: '#7D6B5B' },
    book:     { label: 'Book Page',        icon: 'fa-calendar-check',     url: 'book.html',     color: '#5B6B7D' },
    blog:     { label: 'Blog Page',        icon: 'fa-newspaper',          url: 'blog.html',     color: '#6B5B7D' }
  };

  const PAGE_ZONES = {
    global: [
      {
        id: 'page-names', label: 'Page Names', icon: 'fa-file-signature',
        desc: 'Rename navigation links and page titles shown across the site',
        doc: 'settings/siteContent',
        fields: [
          { key: 'pageNames.home', label: 'Home', type: 'text', placeholder: 'Home' },
          { key: 'pageNames.about', label: 'About', type: 'text', placeholder: 'About' },
          { key: 'pageNames.services', label: 'Services', type: 'text', placeholder: 'Services' },
          { key: 'pageNames.blog', label: 'Blog', type: 'text', placeholder: 'Blog' },
          { key: 'pageNames.contact', label: 'Contact', type: 'text', placeholder: 'Contact' },
          { key: 'pageNames.book', label: 'Book Button', type: 'text', placeholder: 'Book Consultation' }
        ]
      },
      {
        id: 'announcement', label: 'Announcement Bar', icon: 'fa-bullhorn',
        desc: 'Banner text and link shown at the top of every page',
        doc: 'settings/siteContent',
        fields: [
          { key: 'announcement.text', label: 'Banner Text', type: 'text', placeholder: 'Now accepting new families!' },
          { key: 'announcement.linkText', label: 'Link Text', type: 'text', placeholder: 'Book your FREE consultation today' }
        ]
      },
      {
        id: 'footer', label: 'Footer', icon: 'fa-shoe-prints',
        desc: 'Footer tagline, copyright, and slogan across all pages',
        doc: 'settings/siteContent',
        fields: [
          { key: 'footer.tagline', label: 'Footer Tagline', type: 'textarea', placeholder: 'Relationship-centered, individualized occupational therapy...' },
          { key: 'footer.copyright', label: 'Copyright Text', type: 'text', placeholder: 'DunnWell Therapy, LLC. All rights reserved.' },
          { key: 'footer.slogan', label: 'Footer Slogan', type: 'text', placeholder: 'Therapy, Dunn Well.' }
        ]
      },
      {
        id: 'contact-info', label: 'Contact Information', icon: 'fa-phone',
        desc: 'Phone, email, and office address (used site-wide)',
        doc: 'settings/general',
        fields: [
          { key: 'phone', label: 'Phone', type: 'text', placeholder: '(786) 479-3593' },
          { key: 'fax', label: 'Fax', type: 'text', placeholder: '(786) 555-0000' },
          { key: 'emailPrimary', label: 'Primary Email', type: 'text', placeholder: 'care@dunnwelltherapy.com' },
          { key: 'emailSecondary', label: 'Secondary Email', type: 'text', placeholder: 'care@dunnwelltherapy.com' },
          { key: 'address', label: 'Address', type: 'text', placeholder: 'Arlington / Alexandria, Virginia' }
        ]
      },
      {
        id: 'social', label: 'Social Media', icon: 'fa-share-alt',
        desc: 'Facebook, Instagram, LinkedIn links',
        doc: 'settings/general',
        fields: [
          { key: 'social.facebook', label: 'Facebook URL', type: 'text', placeholder: 'https://facebook.com/dunnwelltherapy' },
          { key: 'social.instagram', label: 'Instagram URL', type: 'text', placeholder: 'https://instagram.com/dunnwelltherapy' },
          { key: 'social.linkedin', label: 'LinkedIn URL', type: 'text', placeholder: 'https://linkedin.com/company/dunnwelltherapy' }
        ]
      },
      {
        id: 'hours', label: 'Office Hours', icon: 'fa-clock',
        desc: 'Business hours for each day of the week',
        doc: 'settings/general', hoursEditor: true
      }
    ],
    home: [
      {
        id: 'hero', label: 'Hero Section', icon: 'fa-star',
        desc: 'Main headline, subtitle, body text, and delivery strip',
        doc: 'settings/siteContent',
        fields: [
          { key: 'homeHero.label', label: 'Section Label', type: 'text', placeholder: 'Occupational Therapy for Children, Teens & Families' },
          { key: 'homeHero.h1', label: 'Headline (HTML ok)', type: 'textarea', placeholder: 'Your child doesn\'t need more pressure...' },
          { key: 'homeHero.body', label: 'Body Text', type: 'textarea', placeholder: 'At DunnWell Therapy, we provide...' },
          { key: 'homeHero.delivery', label: 'Delivery Strip', type: 'text', placeholder: 'In-home &bull; Virtual &bull; School & IEP Consulting' }
        ]
      },
      {
        id: 'feature-boxes', label: 'Feature Boxes', icon: 'fa-th-large',
        desc: 'Four service highlight boxes below the hero',
        doc: 'settings/siteContent',
        fields: [
          { key: 'featureBoxes.title1', label: 'Box 1 Title', type: 'text', placeholder: 'In-Home & In-Office' },
          { key: 'featureBoxes.desc1', label: 'Box 1 Description', type: 'text', placeholder: 'Therapy in the environment...' },
          { key: 'featureBoxes.title2', label: 'Box 2 Title', type: 'text', placeholder: 'Virtual OT' },
          { key: 'featureBoxes.desc2', label: 'Box 2 Description', type: 'text', placeholder: 'Executive function coaching...' },
          { key: 'featureBoxes.title3', label: 'Box 3 Title', type: 'text', placeholder: 'Parent Coaching' },
          { key: 'featureBoxes.desc3', label: 'Box 3 Description', type: 'text', placeholder: 'Practical strategies...' },
          { key: 'featureBoxes.title4', label: 'Box 4 Title', type: 'text', placeholder: 'IEP Consulting' },
          { key: 'featureBoxes.desc4', label: 'Box 4 Description', type: 'text', placeholder: 'Navigate evaluations...' }
        ]
      },
      {
        id: 'what-different', label: 'What Makes DunnWell Different', icon: 'fa-fingerprint',
        desc: 'Section label, heading, body, and closing text',
        doc: 'settings/siteContent',
        fields: [
          { key: 'homeDifferent.label', label: 'Section Label', type: 'text', placeholder: 'Why DunnWell' },
          { key: 'homeDifferent.h2', label: 'Heading', type: 'text', placeholder: 'What Makes DunnWell Different' },
          { key: 'homeDifferent.body', label: 'Body Text (HTML ok)', type: 'textarea', placeholder: 'Most therapy focuses on isolated skills...' },
          { key: 'homeDifferent.closing', label: 'Closing Text', type: 'textarea', placeholder: 'We believe meaningful progress happens...' }
        ]
      },
      {
        id: 'differentiators', label: 'Differentiators List', icon: 'fa-check-double',
        desc: 'Checklist items under the bio photo',
        doc: 'settings/homepage', listField: 'differentiators'
      },
      {
        id: 'who-we-help-headings', label: 'Who We Help Headings', icon: 'fa-heading',
        desc: 'Section label, heading, and closing text',
        doc: 'settings/siteContent',
        fields: [
          { key: 'homeWhoWeHelp.label', label: 'Section Label', type: 'text', placeholder: 'Who We Help' },
          { key: 'homeWhoWeHelp.h2', label: 'Heading', type: 'text', placeholder: 'We Support Children & Teens Who Experience Challenges With:' },
          { key: 'homeWhoWeHelp.closing', label: 'Closing Text', type: 'textarea', placeholder: 'We also work closely with parents...' }
        ]
      },
      {
        id: 'who-we-help', label: 'Who We Help Items', icon: 'fa-users',
        desc: 'Challenges and needs we address',
        doc: 'settings/homepage', listField: 'whoWeHelp'
      },
      {
        id: 'how-it-works', label: 'How It Works', icon: 'fa-list-ol',
        desc: 'Three-step process section',
        doc: 'settings/siteContent',
        fields: [
          { key: 'homeHowItWorks.label', label: 'Section Label', type: 'text', placeholder: 'Getting Started' },
          { key: 'homeHowItWorks.h2', label: 'Heading', type: 'text', placeholder: 'How It Works' },
          { key: 'homeHowItWorks.subtitle', label: 'Subtitle', type: 'text', placeholder: 'Starting therapy is simple...' },
          { key: 'homeHowItWorks.step1Title', label: 'Step 1 Title', type: 'text', placeholder: 'Book a Consultation' },
          { key: 'homeHowItWorks.step1Desc', label: 'Step 1 Description', type: 'text', placeholder: 'Schedule a free consultation...' },
          { key: 'homeHowItWorks.step2Title', label: 'Step 2 Title', type: 'text', placeholder: 'Personalized Evaluation' },
          { key: 'homeHowItWorks.step2Desc', label: 'Step 2 Description', type: 'text', placeholder: 'We conduct a comprehensive evaluation...' },
          { key: 'homeHowItWorks.step3Title', label: 'Step 3 Title', type: 'text', placeholder: 'Collaborative Plan' },
          { key: 'homeHowItWorks.step3Desc', label: 'Step 3 Description', type: 'text', placeholder: 'Receive a customized treatment plan...' }
        ]
      },
      {
        id: 'testimonial-headings', label: 'Testimonials Headings', icon: 'fa-heading',
        desc: 'Section headings for the testimonials area',
        doc: 'settings/siteContent',
        fields: [
          { key: 'homeTestimonials.label', label: 'Section Label', type: 'text', placeholder: 'Client Stories' },
          { key: 'homeTestimonials.h2', label: 'Heading', type: 'text', placeholder: 'Real Families. Real Stories.' },
          { key: 'homeTestimonials.subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Our families share how therapy...' }
        ]
      },
      {
        id: 'testimonials', label: 'Testimonials', icon: 'fa-quote-right',
        desc: 'Client stories and video testimonials',
        collection: 'testimonials'
      },
      {
        id: 'cta', label: 'Call-to-Action Quote', icon: 'fa-quote-left',
        desc: 'Quote section before blog preview',
        doc: 'settings/siteContent',
        fields: [
          { key: 'homeCta.quote', label: 'Quote Text', type: 'textarea', placeholder: '"Big skills start with little steps..."' }
        ]
      },
      {
        id: 'blog-headings', label: 'Blog Preview Headings', icon: 'fa-heading',
        desc: 'Section headings for the blog preview area',
        doc: 'settings/siteContent',
        fields: [
          { key: 'homeBlog.label', label: 'Section Label', type: 'text', placeholder: 'From the Blog' },
          { key: 'homeBlog.h2', label: 'Heading', type: 'text', placeholder: 'Resources & Insights' },
          { key: 'homeBlog.subtitle', label: 'Subtitle', type: 'text', placeholder: 'Helpful articles, tips, and education...' }
        ]
      },
      {
        id: 'blog', label: 'Blog Posts', icon: 'fa-newspaper',
        desc: 'Blog posts shown on homepage and blog page',
        collection: 'blogPosts'
      }
    ],
    about: [
      {
        id: 'page-hero', label: 'Page Hero', icon: 'fa-image',
        desc: 'Hero banner heading and subtitle',
        doc: 'settings/siteContent',
        fields: [
          { key: 'aboutHero.label', label: 'Section Label', type: 'text', placeholder: 'About DunnWell' },
          { key: 'aboutHero.h1', label: 'Heading', type: 'text', placeholder: 'Meet Your Therapist' },
          { key: 'aboutHero.subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Relationship-centered, individualized occupational therapy...' }
        ]
      },
      {
        id: 'therapist', label: 'Therapist Info', icon: 'fa-user-md',
        desc: 'Name, credentials, and title',
        doc: 'settings/about',
        fields: [
          { key: 'name', label: 'Name', type: 'text', placeholder: 'Bianca Dunn' },
          { key: 'credentials', label: 'Credentials', type: 'text', placeholder: 'MSOT, OTR/L' },
          { key: 'title', label: 'Title', type: 'text', placeholder: 'Founder & Licensed Occupational Therapist' }
        ]
      },
      {
        id: 'bio', label: 'Bio Sections', icon: 'fa-align-left',
        desc: 'Biography, specialties, and founding story',
        doc: 'settings/about',
        fields: [
          { key: 'bio', label: 'Main Bio', type: 'textarea', placeholder: 'Main biography paragraph...' },
          { key: 'bioExtended', label: 'Extended Bio', type: 'textarea', placeholder: 'Additional biography...' },
          { key: 'specialties', label: 'Specialties', type: 'textarea', placeholder: 'Clinical specialties...' },
          { key: 'founding', label: 'Founding Story', type: 'textarea', placeholder: 'Why DunnWell was founded...' }
        ]
      },
      {
        id: 'education', label: 'Education & Certifications', icon: 'fa-graduation-cap',
        desc: 'Degrees and professional certifications',
        doc: 'settings/about',
        fields: [
          { key: 'education', label: 'Education (one per line)', type: 'textarea', isArray: true },
          { key: 'certifications', label: 'Certifications (one per line)', type: 'textarea', isArray: true }
        ]
      },
      {
        id: 'mission', label: 'Mission & Payment', icon: 'fa-bullseye',
        desc: 'Mission statement and payment info',
        doc: 'settings/about',
        fields: [
          { key: 'mission', label: 'Mission Statement', type: 'textarea', placeholder: 'Our mission is...' },
          { key: 'paymentNote', label: 'Payment Note', type: 'textarea', placeholder: 'Payment information...' }
        ]
      },
      {
        id: 'locations-headings', label: 'Service Locations Headings', icon: 'fa-heading',
        desc: 'Heading text for the service locations section',
        doc: 'settings/siteContent',
        fields: [
          { key: 'aboutLocations.label', label: 'Section Label', type: 'text', placeholder: 'Where We Serve' },
          { key: 'aboutLocations.h2', label: 'Heading', type: 'text', placeholder: 'Service Locations' },
          { key: 'aboutLocations.subtitle', label: 'Subtitle', type: 'text', placeholder: 'We offer flexible service delivery...' }
        ]
      },
      {
        id: 'about-cta', label: 'Call-to-Action', icon: 'fa-bullhorn',
        desc: 'CTA section at the bottom of the about page',
        doc: 'settings/siteContent',
        fields: [
          { key: 'aboutCta.h2', label: 'Heading', type: 'text', placeholder: 'Ready to Start Your Journey?' },
          { key: 'aboutCta.body', label: 'Body Text', type: 'textarea', placeholder: 'Schedule a free consultation...' }
        ]
      }
    ],
    services: [
      {
        id: 'page-hero', label: 'Page Hero', icon: 'fa-image',
        desc: 'Hero banner heading and subtitle',
        doc: 'settings/siteContent',
        fields: [
          { key: 'servicesHero.label', label: 'Section Label', type: 'text', placeholder: 'What We Offer' },
          { key: 'servicesHero.h1', label: 'Heading', type: 'text', placeholder: 'Our Services' },
          { key: 'servicesHero.subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Individualized occupational therapy services...' }
        ]
      },
      {
        id: 'service-cards', label: 'Service Cards', icon: 'fa-hand-holding-medical',
        desc: 'Individual service offerings (In-Home, Virtual, etc.)',
        collection: 'services'
      },
      {
        id: 'approach-headings', label: 'Our Approach Headings', icon: 'fa-heading',
        desc: 'Section headings for the approach area',
        doc: 'settings/siteContent',
        fields: [
          { key: 'servicesApproach.label', label: 'Section Label', type: 'text', placeholder: 'Evidence-Based Care' },
          { key: 'servicesApproach.h2', label: 'Heading', type: 'text', placeholder: 'Our Approach' },
          { key: 'servicesApproach.body', label: 'Body Text', type: 'text', placeholder: 'Our therapy is grounded in current research...' }
        ]
      },
      {
        id: 'approach', label: 'Approach Items', icon: 'fa-brain',
        desc: 'Evidence-based practices list',
        doc: 'settings/servicesPage', listField: 'approach'
      },
      {
        id: 'parent-headings', label: 'What Parents Can Expect Headings', icon: 'fa-heading',
        desc: 'Section headings for the parent expectations area',
        doc: 'settings/siteContent',
        fields: [
          { key: 'servicesParent.label', label: 'Section Label', type: 'text', placeholder: 'Working Together' },
          { key: 'servicesParent.h2', label: 'Heading', type: 'text', placeholder: 'What Parents Can Expect' },
          { key: 'servicesParent.body', label: 'Body Text', type: 'text', placeholder: 'When you partner with DunnWell Therapy...' }
        ]
      },
      {
        id: 'parent-expect', label: 'Parent Expectations Items', icon: 'fa-clipboard-check',
        desc: 'Expectations checklist',
        doc: 'settings/servicesPage', listField: 'parentExpect'
      },
      {
        id: 'payment-headings', label: 'Payment Section Headings', icon: 'fa-credit-card',
        desc: 'Private-pay section headings',
        doc: 'settings/siteContent',
        fields: [
          { key: 'servicesPayment.label', label: 'Section Label', type: 'text', placeholder: 'Payment Information' },
          { key: 'servicesPayment.h2', label: 'Heading', type: 'text', placeholder: 'Private-Pay Practice' }
        ]
      },
      {
        id: 'services-cta', label: 'Call-to-Action', icon: 'fa-bullhorn',
        desc: 'CTA section at the bottom',
        doc: 'settings/siteContent',
        fields: [
          { key: 'servicesCta.h2', label: 'Heading', type: 'text', placeholder: 'Not Sure Which Service Is Right for You?' },
          { key: 'servicesCta.body', label: 'Body Text', type: 'textarea', placeholder: 'Schedule a free consultation...' }
        ]
      }
    ],
    contact: [
      {
        id: 'page-hero', label: 'Page Hero', icon: 'fa-image',
        desc: 'Hero banner heading and subtitle',
        doc: 'settings/siteContent',
        fields: [
          { key: 'contactHero.label', label: 'Section Label', type: 'text', placeholder: 'Get In Touch' },
          { key: 'contactHero.h1', label: 'Heading', type: 'text', placeholder: 'Contact Us' },
          { key: 'contactHero.subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'We\'d love to hear from you...' }
        ]
      },
      {
        id: 'contact-form', label: 'Contact Form Headings', icon: 'fa-pen-to-square',
        desc: 'Form heading and subtitle text',
        doc: 'settings/siteContent',
        fields: [
          { key: 'contactForm.h2', label: 'Form Heading', type: 'text', placeholder: 'Send Us a Message' },
          { key: 'contactForm.subtitle', label: 'Form Subtitle', type: 'text', placeholder: 'Fill out the form below and we\'ll respond within 24 business hours.' }
        ]
      },
      {
        id: 'contact-info', label: 'Contact Information', icon: 'fa-phone',
        desc: 'Phone, email, and office address',
        doc: 'settings/general',
        fields: [
          { key: 'phone', label: 'Phone', type: 'text', placeholder: '(786) 479-3593' },
          { key: 'emailPrimary', label: 'Primary Email', type: 'text', placeholder: 'care@dunnwelltherapy.com' },
          { key: 'emailSecondary', label: 'Secondary Email', type: 'text', placeholder: 'care@dunnwelltherapy.com' },
          { key: 'address', label: 'Address', type: 'text', placeholder: 'Arlington / Alexandria, Virginia' }
        ]
      },
      {
        id: 'hours', label: 'Office Hours', icon: 'fa-clock',
        desc: 'Business hours for each day of the week',
        doc: 'settings/general', hoursEditor: true
      }
    ],
    book: [
      {
        id: 'page-hero', label: 'Page Hero', icon: 'fa-image',
        desc: 'Hero banner heading and subtitle',
        doc: 'settings/siteContent',
        fields: [
          { key: 'bookHero.label', label: 'Section Label', type: 'text', placeholder: 'Get Started' },
          { key: 'bookHero.h1', label: 'Heading', type: 'text', placeholder: 'Book a Consultation' },
          { key: 'bookHero.subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Fill out the form below to request your free consultation...' }
        ]
      },
      {
        id: 'book-form', label: 'Booking Form Headings', icon: 'fa-pen-to-square',
        desc: 'Form heading and subtitle text',
        doc: 'settings/siteContent',
        fields: [
          { key: 'bookForm.h3', label: 'Form Heading', type: 'text', placeholder: 'Request an Appointment' },
          { key: 'bookForm.subtitle', label: 'Form Subtitle', type: 'text', placeholder: 'Complete the form below and your appointment will be added...' }
        ]
      },
      {
        id: 'service-interests', label: 'Service Options', icon: 'fa-list-check',
        desc: 'Dropdown options for the booking form',
        doc: 'settings/general', listField: 'serviceInterests'
      },
      {
        id: 'book-how-it-works', label: 'What to Expect Steps', icon: 'fa-list-ol',
        desc: 'Three-step process section',
        doc: 'settings/siteContent',
        fields: [
          { key: 'bookHowItWorks.label', label: 'Section Label', type: 'text', placeholder: 'Your First Visit' },
          { key: 'bookHowItWorks.h2', label: 'Heading', type: 'text', placeholder: 'What to Expect' },
          { key: 'bookHowItWorks.subtitle', label: 'Subtitle', type: 'text', placeholder: 'Starting therapy is simple...' },
          { key: 'bookHowItWorks.step1Title', label: 'Step 1 Title', type: 'text', placeholder: 'Book & Connect' },
          { key: 'bookHowItWorks.step1Desc', label: 'Step 1 Description', type: 'text', placeholder: 'Schedule your free consultation...' },
          { key: 'bookHowItWorks.step2Title', label: 'Step 2 Title', type: 'text', placeholder: 'Personalized Evaluation' },
          { key: 'bookHowItWorks.step2Desc', label: 'Step 2 Description', type: 'text', placeholder: 'We conduct a comprehensive evaluation...' },
          { key: 'bookHowItWorks.step3Title', label: 'Step 3 Title', type: 'text', placeholder: 'Collaborative Plan' },
          { key: 'bookHowItWorks.step3Desc', label: 'Step 3 Description', type: 'text', placeholder: 'Receive a customized treatment plan...' }
        ]
      }
    ],
    blog: [
      {
        id: 'page-hero', label: 'Page Hero', icon: 'fa-image',
        desc: 'Hero banner heading and subtitle',
        doc: 'settings/siteContent',
        fields: [
          { key: 'blogHero.label', label: 'Section Label', type: 'text', placeholder: 'Resources & Insights' },
          { key: 'blogHero.h1', label: 'Heading', type: 'text', placeholder: 'Our Blog' },
          { key: 'blogHero.subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Helpful articles, tips, and educational resources...' }
        ]
      },
      {
        id: 'blog-posts', label: 'Blog Posts', icon: 'fa-newspaper',
        desc: 'All blog posts',
        collection: 'blogPosts'
      },
      {
        id: 'blog-cta', label: 'Call-to-Action', icon: 'fa-bullhorn',
        desc: 'CTA section at the bottom',
        doc: 'settings/siteContent',
        fields: [
          { key: 'blogCta.h2', label: 'Heading', type: 'text', placeholder: 'Have Questions?' },
          { key: 'blogCta.body', label: 'Body Text', type: 'textarea', placeholder: 'We\'re here to help...' }
        ]
      }
    ]
  };

  function loadPageEditor() {
    if (currentEditorPage) {
      renderPageZones(currentEditorPage);
    } else {
      renderPageCards();
    }
  }

  function renderPageCards() {
    const container = document.getElementById('page-editor-container');
    const html = Object.entries(PAGE_META).map(([id, p]) => `
      <div class="page-card" onclick="adminPanel.selectEditorPage('${id}')">
        <div class="page-card-icon" style="background:${p.color};"><i class="fas ${p.icon}"></i></div>
        <h3>${p.label}</h3>
        <p>${PAGE_ZONES[id].length} editable section${PAGE_ZONES[id].length !== 1 ? 's' : ''}</p>
        <span class="page-card-arrow"><i class="fas fa-arrow-right"></i></span>
      </div>
    `).join('');
    container.innerHTML = '<div class="page-cards-grid">' + html + '</div>';
  }

  function selectEditorPage(pageId) {
    currentEditorPage = pageId;
    renderPageZones(pageId);
  }

  function backToPageCards() {
    currentEditorPage = null;
    renderPageCards();
  }

  function renderPageZones(pageId) {
    const container = document.getElementById('page-editor-container');
    const meta = PAGE_META[pageId];
    const zones = PAGE_ZONES[pageId];

    const zonesHtml = zones.map(z => {
      if (z.navTo) {
        return `
          <div class="zone-card zone-nav" onclick="adminPanel.goToSection('${z.navTo}')">
            <div class="zone-card-header">
              <div class="zone-card-info">
                <i class="fas ${z.icon}"></i>
                <div><h4>${z.label}</h4><p>${z.desc}</p></div>
              </div>
              <span class="zone-card-action"><i class="fas fa-arrow-right"></i> Manage</span>
            </div>
          </div>`;
      }
      return `
        <div class="zone-card" id="zone-${pageId}-${z.id}">
          <div class="zone-card-header" onclick="adminPanel.toggleZone('${pageId}','${z.id}')">
            <div class="zone-card-info">
              <i class="fas ${z.icon}"></i>
              <div><h4>${z.label}</h4><p>${z.desc}</p></div>
            </div>
            <i class="fas fa-chevron-down zone-toggle-icon"></i>
          </div>
          <div class="zone-card-editor" id="zone-editor-${pageId}-${z.id}">
            <div class="zone-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
          </div>
        </div>`;
    }).join('');

    container.innerHTML = `
      <div class="page-editor-back">
        <button class="btn btn-sm btn-secondary" onclick="adminPanel.backToPageCards()">
          <i class="fas fa-arrow-left"></i> All Pages
        </button>
        <a href="${meta.url}" target="_blank" class="btn btn-sm btn-outline">
          <i class="fas fa-external-link-alt"></i> Preview ${meta.label}
        </a>
        <button class="btn btn-sm btn-primary" onclick="adminPanel.saveAllZones('${pageId}')" style="margin-left:auto;">
          <i class="fas fa-save"></i> Save All Changes
        </button>
      </div>
      <div class="page-editor-split">
        <div class="page-editor-zones">${zonesHtml}</div>
        <div class="page-editor-preview">
          <div class="preview-frame-header">
            <span><i class="fas fa-eye"></i> Live Preview</span>
            <button class="btn btn-sm" onclick="document.getElementById('page-preview-iframe').contentWindow.location.reload()">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <iframe id="page-preview-iframe" src="${meta.url}" class="preview-iframe"></iframe>
        </div>
      </div>`;

    zones.forEach(z => { if (z.doc || z.collection) loadZoneData(pageId, z); });
  }

  function toggleZone(pageId, zoneId) {
    const card = document.getElementById('zone-' + pageId + '-' + zoneId);
    if (card) card.classList.toggle('open');
  }

  function goToSection(sectionId) {
    currentEditorPage = null;
    const link = document.querySelector('[data-section="' + sectionId + '"]');
    if (link) link.click();
  }

  async function loadZoneData(pageId, zone) {
    const el = document.getElementById('zone-editor-' + pageId + '-' + zone.id);
    if (!el) return;

    // Collection-type zones (testimonials, blog, services)
    if (zone.collection) {
      try {
        var query = db.collection(zone.collection);
        if (zone.collection === 'blogPosts') query = query.orderBy('date', 'desc');
        else if (zone.collection === 'testimonials' || zone.collection === 'services') query = query.orderBy('order', 'asc');
        var snap = await query.get();
        var html = '<div class="zone-editor-inner">';

        if (zone.collection === 'testimonials') {
          html += '<div style="margin-bottom:0.75rem;"><button class="btn btn-sm btn-primary" onclick="adminPanel.zoneAddTestimonial()"><i class="fas fa-plus"></i> Add Testimonial</button></div>';
          if (snap.empty) {
            html += '<p style="color:#7A6A7B;font-size:0.88rem;">No testimonials yet.</p>';
          } else {
            snap.forEach(function (doc) {
              var d = doc.data();
              html += '<div class="admin-item"><div class="admin-item-content"><h4>' + escapeHtml(d.author || 'Unknown') + '</h4>' +
                '<p>' + escapeHtml(truncate(d.text || '', 80)) + '</p></div>' +
                '<div class="admin-item-actions">' +
                '<button class="btn btn-sm btn-secondary" onclick="adminPanel.editTestimonial(\'' + doc.id + '\')"><i class="fas fa-pen"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="adminPanel.deleteTestimonial(\'' + doc.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></div>';
            });
          }
        } else if (zone.collection === 'blogPosts') {
          html += '<div style="margin-bottom:0.75rem;"><button class="btn btn-sm btn-primary" onclick="adminPanel.zoneAddBlog()"><i class="fas fa-plus"></i> New Post</button></div>';
          if (snap.empty) {
            html += '<p style="color:#7A6A7B;font-size:0.88rem;">No blog posts yet.</p>';
          } else {
            snap.forEach(function (doc) {
              var d = doc.data();
              html += '<div class="admin-item"><div class="admin-item-content"><h4>' + escapeHtml(d.title || 'Untitled') + '</h4>' +
                '<p>' + escapeHtml(d.category || '') + (d.date ? ' &bull; ' + d.date : '') + '</p></div>' +
                '<div class="admin-item-actions">' +
                '<button class="btn btn-sm btn-secondary" onclick="adminPanel.editBlog(\'' + doc.id + '\')"><i class="fas fa-pen"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="adminPanel.deleteBlog(\'' + doc.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></div>';
            });
          }
        } else if (zone.collection === 'services') {
          html += '<div style="margin-bottom:0.75rem;"><button class="btn btn-sm btn-primary" onclick="adminPanel.zoneAddService()"><i class="fas fa-plus"></i> Add Service</button></div>';
          if (snap.empty) {
            html += '<p style="color:#7A6A7B;font-size:0.88rem;">No services yet.</p>';
          } else {
            snap.forEach(function (doc) {
              var d = doc.data();
              html += '<div class="admin-item"><div class="admin-item-content"><h4>' +
                (d.icon ? '<i class="fas ' + escapeHtml(d.icon) + '" style="margin-right:0.4rem;color:#6B2D5B;"></i>' : '') +
                escapeHtml(d.title || 'Untitled') + '</h4>' +
                '<p>' + escapeHtml(truncate(d.short || d.description || '', 60)) + '</p></div>' +
                '<div class="admin-item-actions">' +
                '<button class="btn btn-sm btn-secondary" onclick="adminPanel.editService(\'' + doc.id + '\')"><i class="fas fa-pen"></i></button>' +
                '<button class="btn btn-sm btn-danger" onclick="adminPanel.deleteService(\'' + doc.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div></div>';
            });
          }
        }
        html += '</div>';
        el.innerHTML = html;
      } catch (err) {
        el.innerHTML = '<div class="zone-editor-inner"><p style="color:#C0392B;">Error loading data.</p></div>';
        console.error('Collection zone error:', err);
      }
      return;
    }

    try {
      const snap = await db.doc(zone.doc).get();
      const data = snap.exists ? snap.data() : {};
      let html = '<div class="zone-editor-inner">';

      if (zone.listField) {
        html += renderZoneList(pageId, zone.id, data[zone.listField] || []);
      } else if (zone.hoursEditor) {
        html += renderZoneHours(pageId, zone.id, data.hours || []);
      } else if (zone.fields) {
        html += renderZoneFields(pageId, zone.id, zone.fields, data);
      }

      html += '<div class="zone-save-row">' +
        '<button class="btn btn-primary btn-sm" onclick="adminPanel.saveZone(\'' + pageId + '\',\'' + zone.id + '\')">' +
        '<i class="fas fa-save"></i> Save</button></div></div>';
      el.innerHTML = html;
    } catch (err) {
      el.innerHTML = '<div class="zone-editor-inner"><p style="color:#C0392B;">Error loading data. Try refreshing.</p></div>';
      console.error('Zone load error:', err);
    }
  }

  function renderZoneFields(pageId, zoneId, fields, data) {
    return fields.map(function (f) {
      var value = '';
      if (f.key.indexOf('.') !== -1) {
        var parts = f.key.split('.');
        value = data[parts[0]] ? (data[parts[0]][parts[1]] || '') : '';
      } else if (f.isArray && Array.isArray(data[f.key])) {
        value = data[f.key].join('\n');
      } else {
        value = data[f.key] || '';
      }
      var escaped = escapeHtml(value);
      var inputId = 'ze-' + pageId + '-' + zoneId + '-' + f.key.replace(/\./g, '-');

      if (f.type === 'textarea') {
        return '<div class="form-group"><label>' + f.label + '</label>' +
          '<textarea class="form-control" id="' + inputId + '" rows="4" placeholder="' + (f.placeholder || '') + '">' + escaped + '</textarea></div>';
      }
      return '<div class="form-group"><label>' + f.label + '</label>' +
        '<input type="text" class="form-control" id="' + inputId + '" value="' + escaped + '" placeholder="' + (f.placeholder || '') + '"></div>';
    }).join('');
  }

  function renderZoneList(pageId, zoneId, items) {
    var listId = 'ze-list-' + pageId + '-' + zoneId;
    var arr = items.length ? items : [''];
    var rows = arr.map(function (item) {
      return '<div class="feature-row"><input type="text" class="form-control" value="' + escapeHtml(item) + '">' +
        '<button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button></div>';
    }).join('');
    return '<div id="' + listId + '" class="features-list">' + rows + '</div>' +
      '<button class="btn btn-sm btn-secondary" style="margin-top:0.5rem;" onclick="adminPanel.addZoneListRow(\'' + listId + '\')">' +
      '<i class="fas fa-plus"></i> Add Item</button>';
  }

  function renderZoneHours(pageId, zoneId, hours) {
    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var hoursMap = {};
    (hours || []).forEach(function (h) { hoursMap[h.day] = h.hours; });
    return '<div class="hours-editor">' + days.map(function (day) {
      return '<div class="hours-row"><label>' + day + '</label>' +
        '<input type="text" class="form-control" data-ze-day="' + day + '" value="' + escapeHtml(hoursMap[day] || '') + '" placeholder="e.g., 9:00 AM - 5:00 PM"></div>';
    }).join('') + '</div>';
  }

  function addZoneListRow(listId) {
    var list = document.getElementById(listId);
    if (!list) return;
    var row = document.createElement('div');
    row.className = 'feature-row';
    row.innerHTML = '<input type="text" class="form-control" value=""><button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';
    list.appendChild(row);
    row.querySelector('input').focus();
  }

  async function saveZone(pageId, zoneId) {
    var zone = PAGE_ZONES[pageId].find(function (z) { return z.id === zoneId; });
    if (!zone || !zone.doc) return;

    try {
      var updateData = {};

      if (zone.listField) {
        var listId = 'ze-list-' + pageId + '-' + zoneId;
        var listEl = document.getElementById(listId);
        var items = [];
        if (listEl) {
          listEl.querySelectorAll('.feature-row input').forEach(function (inp) {
            var v = inp.value.trim();
            if (v) items.push(v);
          });
        }
        updateData[zone.listField] = items;
      } else if (zone.hoursEditor) {
        var hours = [];
        document.querySelectorAll('#zone-editor-' + pageId + '-' + zoneId + ' [data-ze-day]').forEach(function (inp) {
          hours.push({ day: inp.dataset.zeDay, hours: inp.value.trim() });
        });
        updateData.hours = hours;
      } else if (zone.fields) {
        zone.fields.forEach(function (f) {
          var inputId = 'ze-' + pageId + '-' + zoneId + '-' + f.key.replace(/\./g, '-');
          var el = document.getElementById(inputId);
          if (!el) return;
          var value = el.value.trim();
          if (f.isArray) {
            value = value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
          }
          if (f.key.indexOf('.') !== -1) {
            var parts = f.key.split('.');
            if (!updateData[parts[0]]) updateData[parts[0]] = {};
            updateData[parts[0]][parts[1]] = value;
          } else {
            updateData[f.key] = value;
          }
        });
      }

      await db.doc(zone.doc).set(updateData, { merge: true });
      showToast('Saved successfully!', 'success');

      // Refresh live preview
      var iframe = document.getElementById('page-preview-iframe');
      if (iframe) {
        try { iframe.contentWindow.location.reload(); } catch (_) {}
      }
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error');
      console.error('Zone save error:', err);
    }
  }

  // Zone wrappers — open existing modals from the Page Editor
  function zoneAddTestimonial() { openTestimonialModal(null); }
  function zoneAddBlog() { openBlogModal(null); }
  function zoneAddService() { openServiceModal(null); }

  // Refresh collection zones after modal save (override close behavior)
  function refreshCollectionZones() {
    if (!currentEditorPage) return;
    var zones = PAGE_ZONES[currentEditorPage];
    if (!zones) return;
    zones.forEach(function (z) {
      if (z.collection) loadZoneData(currentEditorPage, z);
    });
    var iframe = document.getElementById('page-preview-iframe');
    if (iframe) { try { iframe.contentWindow.location.reload(); } catch (_) {} }
  }

  async function saveAllZones(pageId) {
    var zones = PAGE_ZONES[pageId];
    if (!zones) return;
    var saveable = zones.filter(function (z) { return z.doc && !z.navTo; });
    if (!saveable.length) return;

    // Group zones by Firestore doc to batch fields together
    var docUpdates = {};
    saveable.forEach(function (zone) {
      if (!docUpdates[zone.doc]) docUpdates[zone.doc] = {};
      var update = docUpdates[zone.doc];

      if (zone.listField) {
        var listId = 'ze-list-' + pageId + '-' + zone.id;
        var listEl = document.getElementById(listId);
        var items = [];
        if (listEl) {
          listEl.querySelectorAll('.feature-row input').forEach(function (inp) {
            var v = inp.value.trim();
            if (v) items.push(v);
          });
        }
        update[zone.listField] = items;
      } else if (zone.hoursEditor) {
        var hours = [];
        document.querySelectorAll('#zone-editor-' + pageId + '-' + zone.id + ' [data-ze-day]').forEach(function (inp) {
          hours.push({ day: inp.dataset.zeDay, hours: inp.value.trim() });
        });
        update.hours = hours;
      } else if (zone.fields) {
        zone.fields.forEach(function (f) {
          var inputId = 'ze-' + pageId + '-' + zone.id + '-' + f.key.replace(/\./g, '-');
          var el = document.getElementById(inputId);
          if (!el) return;
          var value = el.value.trim();
          if (f.isArray) {
            value = value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
          }
          if (f.key.indexOf('.') !== -1) {
            var parts = f.key.split('.');
            if (!update[parts[0]]) update[parts[0]] = {};
            update[parts[0]][parts[1]] = value;
          } else {
            update[f.key] = value;
          }
        });
      }
    });

    try {
      var promises = Object.keys(docUpdates).map(function (docPath) {
        return db.doc(docPath).set(docUpdates[docPath], { merge: true });
      });
      await Promise.all(promises);
      showToast('All changes saved!', 'success');
      var iframe = document.getElementById('page-preview-iframe');
      if (iframe) {
        try { iframe.contentWindow.location.reload(); } catch (_) {}
      }
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error');
      console.error('Save all error:', err);
    }
  }

  // ---- Wire Up Event Listeners ----
  function setupEventListeners() {
    document.getElementById('add-blog-btn').addEventListener('click', () => openBlogModal(null));
    document.getElementById('save-blog-btn').addEventListener('click', saveBlogPost);

    document.getElementById('add-testimonial-btn').addEventListener('click', () => openTestimonialModal(null));
    document.getElementById('save-testimonial-btn').addEventListener('click', saveTestimonial);

    // Video testimonials
    document.getElementById('add-video-url-btn').addEventListener('click', addVideoTestimonialByUrl);
    document.getElementById('add-video-upload-btn').addEventListener('click', () => {
      document.getElementById('video-upload-input').click();
    });
    document.getElementById('video-upload-input').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        uploadVideoTestimonial(e.target.files[0]);
        e.target.value = '';
      }
    });

    document.getElementById('add-service-btn').addEventListener('click', () => openServiceModal(null));
    document.getElementById('save-service-btn').addEventListener('click', saveService);
    document.getElementById('add-feature-btn').addEventListener('click', () => addFeatureRow(''));

    document.getElementById('save-about-btn').addEventListener('click', saveAbout);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('import-config-btn').addEventListener('click', importFromConfig);

    // Theme & Colors
    document.getElementById('save-theme-btn').addEventListener('click', saveTheme);
    document.getElementById('reset-theme-btn').addEventListener('click', resetTheme);
    setupThemeColorSync();

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
    deleteVideoTestimonial,
    editService,
    deleteService,
    copyImageUrl,
    deleteImage,
    selectPatient,
    editPatient,
    deletePatient,
    editNote,
    deleteNote,
    emailNote,
    selectEditorPage,
    backToPageCards,
    toggleZone,
    goToSection,
    saveZone,
    saveAllZones,
    addZoneListRow,
    zoneAddTestimonial,
    zoneAddBlog,
    zoneAddService
  };

})();
