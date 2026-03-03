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
      case 'blog': loadBlogPosts(); break;
      case 'testimonials': loadTestimonials(); break;
      case 'services': loadServices(); break;
      case 'about': loadAbout(); break;
      case 'settings': loadSettings(); break;
      case 'images': loadImages(); break;
    }
  }

  // ---- Dashboard ----
  async function loadDashboard() {
    try {
      const [blogSnap, testimSnap, servSnap] = await Promise.all([
        db.collection('blogPosts').get(),
        db.collection('testimonials').get(),
        db.collection('services').get()
      ]);
      document.getElementById('stat-posts').textContent = blogSnap.size;
      document.getElementById('stat-testimonials').textContent = testimSnap.size;
      document.getElementById('stat-services').textContent = servSnap.size;

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

      // Import settings
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
        importedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Import about
      batch.set(db.collection('settings').doc('about'), {
        ...SITE_CONFIG.about,
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
    deleteImage
  };

})();
