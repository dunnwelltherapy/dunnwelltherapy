/* ============================================================
   DUNNWELL THERAPY - Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Load content from Firebase (falls back to config.js if unavailable)
  if (window._dunnwellFirebase) {
    await window._dunnwellFirebase.loadFirebaseContent();
  }

  initAnnouncementBar();
  initNavigation();
  initScrollEffects();
  initBackToTop();
  renderFooter();
  renderAboutPreview();
  renderDifferentiators();
  renderWhoWeHelp();
  renderApproach();
  renderParentExpect();
  renderServicesPreview();
  renderServicesFull();
  renderTestimonials();
  renderBlogPreview();
  renderAboutFull();
  renderContactPage();
  renderServiceLocations();
  renderServicesPaymentNote();
  populateBookingDropdowns();
});

/* ----------------------------------------------------------
 *  ANNOUNCEMENT BAR
 * ---------------------------------------------------------- */
function initAnnouncementBar() {
  const bar = document.getElementById('announcementBar');
  const closeBtn = document.getElementById('closeBar');
  if (!bar || !closeBtn) return;

  if (sessionStorage.getItem('announcementClosed')) {
    bar.style.display = 'none';
    return;
  }

  closeBtn.addEventListener('click', () => {
    bar.style.display = 'none';
    sessionStorage.setItem('announcementClosed', 'true');
  });
}

/* ----------------------------------------------------------
 *  NAVIGATION
 * ---------------------------------------------------------- */
function initNavigation() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('open');
    });
  });

  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* ----------------------------------------------------------
 *  SCROLL ANIMATIONS (fade-up, fade-left, fade-right, scale-in)
 * ---------------------------------------------------------- */
function initScrollEffects() {
  const animatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in');
  if (!animatedElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  animatedElements.forEach(el => observer.observe(el));
}

/* ----------------------------------------------------------
 *  BACK TO TOP
 * ---------------------------------------------------------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 600);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ----------------------------------------------------------
 *  FOOTER
 * ---------------------------------------------------------- */
function renderFooter() {
  const C = SITE_CONFIG;

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const socialEl = document.getElementById('footer-social');
  if (socialEl) {
    socialEl.innerHTML = `
      <a href="${C.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
      <a href="${C.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
      <a href="${C.social.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
    `;
  }

  const servicesEl = document.getElementById('footer-services');
  if (servicesEl) {
    servicesEl.innerHTML = C.services.map(s =>
      `<li><a href="services.html#${s.id}">${s.title}</a></li>`
    ).join('');
  }

  const contactEl = document.getElementById('footer-contact');
  if (contactEl) {
    contactEl.innerHTML = `
      <div class="footer-contact-item"><i class="fas fa-phone"></i><span>${C.phone}</span></div>
      <div class="footer-contact-item"><i class="fas fa-envelope"></i><span>${C.emailPrimary}</span></div>
      <div class="footer-contact-item"><i class="fas fa-location-dot"></i><span>${C.address}</span></div>
    `;
  }
}

/* ----------------------------------------------------------
 *  ABOUT PREVIEW (home page)
 * ---------------------------------------------------------- */
function renderAboutPreview() {
  const C = SITE_CONFIG.about;
  const nameEl = document.getElementById('about-name');
  if (!nameEl) return;

  nameEl.textContent = `Meet ${C.name}, ${C.credentials}`;
  const credEl = document.getElementById('about-credentials');
  if (credEl) credEl.textContent = C.title;
  const bioEl = document.getElementById('about-bio');
  if (bioEl) bioEl.textContent = C.bio;
}

/* ----------------------------------------------------------
 *  DIFFERENTIATORS (home page)
 * ---------------------------------------------------------- */
function renderDifferentiators() {
  const el = document.getElementById('differentiators-list');
  if (!el) return;

  el.innerHTML = SITE_CONFIG.differentiators.map(d =>
    `<li style="padding: 0.5rem 0; padding-left: 2rem; position: relative; color: var(--text-body); font-size: 0.95rem; line-height: 1.7;">
      <i class="fas fa-check" style="position: absolute; left: 0; top: 0.7rem; color: var(--plum-light); font-size: 0.85rem;"></i>
      ${d}
    </li>`
  ).join('');
}

/* ----------------------------------------------------------
 *  WHO WE HELP (home page)
 * ---------------------------------------------------------- */
function renderWhoWeHelp() {
  const el = document.getElementById('who-we-help-list');
  if (!el) return;

  el.innerHTML = SITE_CONFIG.whoWeHelp.map(item =>
    `<li style="padding: 0.45rem 0; padding-left: 1.75rem; position: relative; color: rgba(255,255,255,0.85); font-size: 0.95rem;">
      <span style="position: absolute; left: 0; top: 0.55rem; width: 8px; height: 8px; border-radius: 50%; background: var(--mauve);"></span>
      ${item}
    </li>`
  ).join('');
}

/* ----------------------------------------------------------
 *  OUR APPROACH (services page)
 * ---------------------------------------------------------- */
function renderApproach() {
  const el = document.getElementById('approach-list');
  if (!el || !SITE_CONFIG.approach) return;

  el.innerHTML = SITE_CONFIG.approach.map(item =>
    `<li style="padding: 0.45rem 0; padding-left: 1.75rem; position: relative; color: rgba(255,255,255,0.85); font-size: 0.95rem;">
      <span style="position: absolute; left: 0; top: 0.55rem; width: 8px; height: 8px; border-radius: 50%; background: var(--mauve);"></span>
      ${item}
    </li>`
  ).join('');
}

/* ----------------------------------------------------------
 *  WHAT PARENTS CAN EXPECT (services page)
 * ---------------------------------------------------------- */
function renderParentExpect() {
  const el = document.getElementById('parent-expect-list');
  if (!el || !SITE_CONFIG.parentExpect) return;

  el.innerHTML = SITE_CONFIG.parentExpect.map(item =>
    `<li style="padding: 0.5rem 0; padding-left: 2rem; position: relative; color: var(--text-body); font-size: 0.95rem; line-height: 1.7;">
      <i class="fas fa-check" style="position: absolute; left: 0; top: 0.7rem; color: var(--plum-light); font-size: 0.85rem;"></i>
      ${item}
    </li>`
  ).join('');
}

/* ----------------------------------------------------------
 *  ABOUT FULL PAGE
 * ---------------------------------------------------------- */
function renderAboutFull() {
  const C = SITE_CONFIG.about;
  const nameEl = document.getElementById('about-name-full');
  if (!nameEl) return;

  nameEl.textContent = `${C.name}, ${C.credentials}`;
  document.getElementById('about-credentials-full').textContent = C.title;

  // Build full bio from all sections
  const bioEl = document.getElementById('about-bio-full');
  if (bioEl) {
    bioEl.innerHTML = `
      <p>${C.bio}</p>
      ${C.bioExtended ? `<p style="margin-top: 1rem;">${C.bioExtended}</p>` : ''}
      ${C.specialties ? `<p style="margin-top: 1rem;">${C.specialties}</p>` : ''}
      ${C.founding ? `<p style="margin-top: 1rem;">${C.founding}</p>` : ''}
    `;
  }

  const missionEl = document.getElementById('about-mission');
  if (missionEl) missionEl.textContent = C.mission;

  const paymentEl = document.getElementById('about-payment');
  if (paymentEl) paymentEl.textContent = C.paymentNote;

  const eduEl = document.getElementById('about-education');
  if (eduEl) eduEl.innerHTML = C.education.map(e => `<li>${e}</li>`).join('');

  const certEl = document.getElementById('about-certifications');
  if (certEl) certEl.innerHTML = C.certifications.map(c => `<li>${c}</li>`).join('');
}

/* ----------------------------------------------------------
 *  SERVICES PREVIEW (home page)
 * ---------------------------------------------------------- */
function renderServicesPreview() {
  const el = document.getElementById('services-preview');
  if (!el) return;

  el.innerHTML = SITE_CONFIG.services.map(s => `
    <div class="card fade-up">
      <div class="card-icon"><i class="fas ${s.icon}"></i></div>
      <h3>${s.title}</h3>
      <p>${s.short}</p>
      <a href="services.html#${s.id}" class="read-more" style="margin-top: 0.75rem;">
        Learn More <i class="fas fa-arrow-right"></i>
      </a>
    </div>
  `).join('');

  initScrollEffects();
}

/* ----------------------------------------------------------
 *  SERVICES FULL PAGE
 * ---------------------------------------------------------- */
function renderServicesFull() {
  const el = document.getElementById('services-full');
  if (!el) return;

  el.innerHTML = SITE_CONFIG.services.map((s, i) => `
    <div id="${s.id}" class="fade-up" style="margin-bottom: 3rem; scroll-margin-top: 100px;">
      <div style="display: grid; grid-template-columns: ${i % 2 === 0 ? '1fr 1.5fr' : '1.5fr 1fr'}; gap: 3rem; align-items: center;" class="service-detail-grid">
        <div ${i % 2 !== 0 ? 'style="order: 2;"' : ''}>
          <div style="background: var(--lavender); border-radius: var(--radius-lg); padding: 3rem; text-align: center;">
            <i class="fas ${s.icon}" style="font-size: 4rem; color: var(--plum-light);"></i>
          </div>
        </div>
        <div>
          <h2 style="margin-bottom: 1rem; font-size: 1.8rem;">${s.title}</h2>
          <p style="margin-bottom: 1.25rem; line-height: 1.85;">${s.description}</p>
          <ul class="service-features">
            ${s.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
          <a href="book.html" class="btn btn-primary" style="margin-top: 1.5rem;">
            <i class="fas fa-calendar-check"></i> Book This Service
          </a>
        </div>
      </div>
    </div>
    ${i < SITE_CONFIG.services.length - 1 ? '<hr style="border: none; border-top: 1px solid var(--mauve-light); margin: 0 0 3rem;">' : ''}
  `).join('');

  const style = document.createElement('style');
  style.textContent = `@media (max-width: 768px) { .service-detail-grid { grid-template-columns: 1fr !important; } .service-detail-grid > div { order: 0 !important; } }`;
  document.head.appendChild(style);
  initScrollEffects();
}

/* ----------------------------------------------------------
 *  SERVICE LOCATIONS (about page)
 * ---------------------------------------------------------- */
function renderServiceLocations() {
  const el = document.getElementById('service-locations');
  if (!el || !SITE_CONFIG.serviceLocations) return;

  el.innerHTML = SITE_CONFIG.serviceLocations.map(loc => `
    <div class="card fade-up" style="text-align: center;">
      <div class="card-icon" style="margin: 0 auto 1rem;"><i class="fas ${loc.icon}"></i></div>
      <h3>${loc.type}</h3>
      <p>${loc.description}</p>
    </div>
  `).join('');
  initScrollEffects();
}

/* ----------------------------------------------------------
 *  SERVICES PAYMENT NOTE (services page)
 * ---------------------------------------------------------- */
function renderServicesPaymentNote() {
  const el = document.getElementById('services-payment-note');
  if (!el || !SITE_CONFIG.about.paymentNote) return;
  el.textContent = SITE_CONFIG.about.paymentNote;
}

/* ----------------------------------------------------------
 *  TESTIMONIALS
 * ---------------------------------------------------------- */
function renderTestimonials() {
  const el = document.getElementById('testimonials');
  if (!el) return;

  el.innerHTML = SITE_CONFIG.testimonials.map(t => `
    <div class="testimonial-card fade-up">
      <p>${t.text}</p>
      <div>
        <span class="testimonial-author">${t.author}</span>
        <span class="testimonial-role"> &mdash; ${t.role}</span>
      </div>
    </div>
  `).join('');
  initScrollEffects();
}

/* ----------------------------------------------------------
 *  BLOG PREVIEW
 * ---------------------------------------------------------- */
function renderBlogPreview() {
  const el = document.getElementById('blog-preview');
  if (!el) return;

  const posts = SITE_CONFIG.blogPosts.slice(0, 3);
  el.innerHTML = posts.map(p => renderBlogCard(p)).join('');
}

function renderBlogCard(post) {
  const date = new Date(post.date + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
    <div class="blog-card fade-up" data-category="${post.category}">
      <div class="blog-card-image"><i class="fas fa-newspaper"></i></div>
      <div class="blog-card-body">
        <span class="blog-category">${post.category}</span>
        <div class="blog-card-meta">
          <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
          <span><i class="fas fa-user"></i> ${post.author}</span>
        </div>
        <h3><a href="blog.html?post=${post.id}">${post.title}</a></h3>
        <p class="excerpt">${post.excerpt}</p>
        <a href="blog.html?post=${post.id}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
      </div>
    </div>
  `;
}
window.renderBlogCard = renderBlogCard;

/* ----------------------------------------------------------
 *  CONTACT PAGE
 * ---------------------------------------------------------- */
function renderContactPage() {
  const C = SITE_CONFIG;

  const phoneEl = document.getElementById('contact-phone');
  if (phoneEl) phoneEl.textContent = C.phone;

  const faxEl = document.getElementById('contact-fax');
  if (faxEl) faxEl.textContent = C.fax;

  const emailEl = document.getElementById('contact-email');
  if (emailEl) emailEl.textContent = C.emailPrimary;

  const addrEl = document.getElementById('contact-address');
  if (addrEl) addrEl.textContent = C.address;

  const hoursEl = document.getElementById('contact-hours');
  if (hoursEl) {
    hoursEl.innerHTML = C.hours.map(h =>
      `<li><span>${h.day}</span><span>${h.time}</span></li>`
    ).join('');
  }

  const mapEl = document.getElementById('contact-map');
  if (mapEl) mapEl.src = C.googleMapsEmbed;

  // Service interest dropdown
  const serviceInterestEl = document.getElementById('service-interest-select');
  if (serviceInterestEl && C.serviceInterests) {
    C.serviceInterests.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      serviceInterestEl.appendChild(opt);
    });
  }
}

/* ----------------------------------------------------------
 *  BOOKING PAGE DROPDOWNS
 * ---------------------------------------------------------- */
function populateBookingDropdowns() {
  const C = SITE_CONFIG;

  // Service dropdowns on booking page
  ['gcal-service', 'manual-service-select'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">Select a service...</option>';
    C.serviceInterests.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      el.appendChild(opt);
    });
  });

  const spLink = document.getElementById('sp-booking-link');
  if (spLink) spLink.href = C.simplePractice.bookingUrl;

  // Booking tabs
  document.querySelectorAll('.booking-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.booking-tab[data-tab]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  const manualForm = document.getElementById('manual-booking-form');
  if (manualForm) manualForm.addEventListener('submit', handleManualBooking);

  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => { input.min = today; });
}

/* ----------------------------------------------------------
 *  MANUAL BOOKING FORM
 * ---------------------------------------------------------- */
function handleManualBooking(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const C = SITE_CONFIG;

  if (C.emailjs.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
    const subject = encodeURIComponent(`New Booking Request - ${data.get('firstName')} ${data.get('lastName')}`);
    const body = encodeURIComponent(
      `New Booking Request\n\nName: ${data.get('firstName')} ${data.get('lastName')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nChild / Client Age: ${data.get('clientAge') || 'Not provided'}\nLocation: ${data.get('state') || 'Not specified'}\nPreferred Date: ${data.get('preferredDate')}\nPreferred Time: ${data.get('preferredTime')}\nService: ${data.get('service')}\nMessage / Goals: ${data.get('notes')}\n`
    );
    window.location.href = `mailto:${C.emailPrimary}?cc=${C.emailSecondary}&subject=${subject}&body=${body}`;
    showAlert('booking-success');
    form.reset();
    return;
  }

  emailjs.init(C.emailjs.publicKey);
  emailjs.send(C.emailjs.serviceId, C.emailjs.bookingTemplateId, {
    to_email_1: C.emailPrimary,
    to_email_2: C.emailSecondary,
    from_name: `${data.get('firstName')} ${data.get('lastName')}`,
    from_email: data.get('email'),
    phone: data.get('phone'),
    client_age: data.get('clientAge') || 'Not provided',
    state: data.get('state') || 'Not specified',
    preferred_date: data.get('preferredDate'),
    preferred_time: data.get('preferredTime'),
    service: data.get('service'),
    notes: data.get('notes'),
  }).then(() => {
    showAlert('booking-success');
    form.reset();
  }).catch(err => {
    console.error('EmailJS error:', err);
    showAlert('booking-error');
  });
}

/* ----------------------------------------------------------
 *  ALERT HELPER
 * ---------------------------------------------------------- */
function showAlert(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => el.classList.remove('show'), 8000);
}
window.showAlert = showAlert;
