/* ============================================================
   DUNNWELL THERAPY - Blog / Forum Handler
   Renders blog posts from config.js, supports category
   filtering and individual post views via URL params.

   TO ADD A NEW POST:
   Open js/config.js and add a new entry at the TOP of
   the blogPosts array. That's it — it will appear
   automatically on the blog page and home page preview.
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const listSection = document.getElementById('blog-list-section');
  if (!listSection) return;

  // Load content from Firebase (falls back to config.js if unavailable)
  if (window._dunnwellFirebase) {
    await window._dunnwellFirebase.loadFirebaseContent();
  }

  // Build category filter buttons dynamically from blog data
  buildCategoryFilters();

  // Check if we're viewing a single post
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('post');

  if (postId) {
    showSinglePost(postId);
  } else {
    renderBlogList();
  }

  initCategoryFilters();
  initBackButton();
});

/* ----------------------------------------------------------
 *  Build category filter buttons from blog post data
 * ---------------------------------------------------------- */
function buildCategoryFilters() {
  const container = document.getElementById('blog-category-filters');
  if (!container) return;

  const categories = [...new Set(SITE_CONFIG.blogPosts.map(p => p.category).filter(Boolean))];
  let html = '<button class="booking-tab active" data-category="all">All Posts</button>';
  categories.forEach(cat => {
    html += `<button class="booking-tab" data-category="${cat}">${cat}</button>`;
  });
  container.innerHTML = html;
}

/* ----------------------------------------------------------
 *  Render all blog posts
 * ---------------------------------------------------------- */
function renderBlogList() {
  const el = document.getElementById('blog-full-list');
  if (!el) return;

  el.innerHTML = SITE_CONFIG.blogPosts.map(p => window.renderBlogCard(p)).join('');

  // Re-init scroll effects for newly rendered cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  el.querySelectorAll('.fade-up').forEach(card => observer.observe(card));
}

/* ----------------------------------------------------------
 *  Category filtering
 * ---------------------------------------------------------- */
function initCategoryFilters() {
  document.querySelectorAll('.booking-tab[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      document.querySelectorAll('.booking-tab[data-category]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;
      const cards = document.querySelectorAll('.blog-card');

      cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ----------------------------------------------------------
 *  Single post view
 * ---------------------------------------------------------- */
function showSinglePost(postId) {
  const post = SITE_CONFIG.blogPosts.find(p => p.id === postId);
  if (!post) {
    // Post not found, show list
    renderBlogList();
    return;
  }

  // Hide list, show single
  const listSection = document.getElementById('blog-list-section');
  const singleSection = document.getElementById('blog-single-section');
  if (listSection) listSection.style.display = 'none';
  if (singleSection) singleSection.style.display = 'block';

  const contentEl = document.getElementById('blog-post-content');
  if (!contentEl) return;

  const date = new Date(post.date + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  contentEl.innerHTML = `
    <span class="blog-category">${post.category}</span>
    <h1 style="margin: 1rem 0 0.5rem; font-size: 2.2rem;">${post.title}</h1>
    <div class="blog-card-meta" style="margin-bottom: 2rem;">
      <span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
      <span><i class="fas fa-user"></i> ${post.author}</span>
    </div>
    <div class="divider" style="margin: 0 0 2rem;"></div>
    ${post.content}
    <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--mauve-light);">
      <h3 style="color: var(--plum); margin-bottom: 1rem;">Ready to take the next step?</h3>
      <p>If you have questions about this topic or want to learn how occupational therapy can help, we'd love to hear from you.</p>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem;">
        <a href="book.html" class="btn btn-primary"><i class="fas fa-calendar-check"></i> Book Consultation</a>
        <a href="contact.html" class="btn btn-outline"><i class="fas fa-envelope"></i> Contact Us</a>
      </div>
    </div>
  `;

  // Update page title
  document.title = `${post.title} | Dunnwell Therapy Blog`;
}

/* ----------------------------------------------------------
 *  Back button
 * ---------------------------------------------------------- */
function initBackButton() {
  const backBtn = document.getElementById('blog-back-btn');
  if (!backBtn) return;

  backBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Clear URL param
    const url = new URL(window.location);
    url.searchParams.delete('post');
    window.history.pushState({}, '', url);

    // Show list, hide single
    const listSection = document.getElementById('blog-list-section');
    const singleSection = document.getElementById('blog-single-section');
    if (listSection) listSection.style.display = 'block';
    if (singleSection) singleSection.style.display = 'none';

    renderBlogList();
    document.title = 'Blog | Dunnwell Therapy';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('post');

  if (postId) {
    showSinglePost(postId);
  } else {
    const listSection = document.getElementById('blog-list-section');
    const singleSection = document.getElementById('blog-single-section');
    if (listSection) listSection.style.display = 'block';
    if (singleSection) singleSection.style.display = 'none';
    renderBlogList();
  }
});
