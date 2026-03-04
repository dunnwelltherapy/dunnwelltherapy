# DunnWell Therapy Website — Build Log

## Project Overview

Professional website for **DunnWell Therapy, LLC**, an occupational therapy practice founded by **Bianca Dunn, MSOT, OTR/L**. The site is a static HTML/CSS/JS website with a config-driven architecture for easy content updates.

**Live Preview:** `http://localhost:8090` (when local server is running)

---

## Architecture & Tech Stack

- **Static HTML/CSS/JS** (no frameworks)
- **Firebase Spark (free tier)** backend for admin panel:
  - **Firebase Authentication** for secure admin login (email + password)
  - **Cloud Firestore** for storing all site content
  - **Firebase Storage** for image uploads (requires Blaze plan upgrade, currently bypassed)
- **Config-driven content** via `js/config.js` (fallback when Firebase is unavailable)
- **Quill.js** rich text editor for blog posts in admin panel
- **EmailJS** for dual-email contact form delivery (with mailto fallback)
- **Google Calendar API** OAuth2 integration (placeholder credentials)
- **Simple Practice** booking widget embed (placeholder URL)
- **Google Fonts:** Playfair Display (headings) + Inter (body)
- **Font Awesome 6.5.1** for icons
- **IntersectionObserver** for scroll animations
- **Session storage** for announcement bar dismissal
- **URL parameter-based** blog post routing (`?post=post-id`)

---

## File Structure

```
/Volumes/Willie Extr/Bianca Dunn/website/
├── index.html              # Homepage
├── about.html              # About / Meet Your Therapist
├── services.html           # Services page
├── contact.html            # Contact form + info
├── book.html               # Book Consultation (3 methods)
├── blog.html               # Blog / Resources
├── admin.html              # Admin dashboard (password-protected)
├── css/
│   ├── styles.css          # Full stylesheet
│   └── admin.css           # Admin panel styles
├── js/
│   ├── config.js           # Fallback site content (used when Firebase is unavailable)
│   ├── firebase-config.js  # Firebase project credentials (user fills in)
│   ├── firebase-loader.js  # Loads Firestore data into SITE_CONFIG on public pages
│   ├── admin.js            # Admin CRUD logic, auth, image uploads, rich text editor
│   ├── main.js             # Core JS (nav, footer, renders)
│   ├── contact.js          # Contact form handler
│   ├── calendar.js         # Google Calendar OAuth flow
│   └── blog.js             # Blog rendering & filtering
├── images/
│   ├── logo-full.png       # Logo with tagline (Design 1, purple)
│   ├── logo-no-tagline.png # Logo without tagline (Design 2)
│   ├── logo-text-only.png  # Text-only logo (Design 3)
│   ├── logo-icon.png       # Lotus icon only (Design 4)
│   ├── bianca-dunn.png     # Bianca's professional headshot
│   ├── testimonial-video.mov # Video testimonial (original)
│   ├── testimonial-video.mp4 # Video testimonial (converted for browser compatibility)
│   ├── aota.png              # AOTA credential logo (transparent)
│   ├── dc-health.png         # DC Health credential logo
│   ├── florida-health.png    # Florida Health credential logo (transparent)
│   └── texas-hhs.png         # Texas HHS credential logo (transparent)
└── CHANGELOG.md            # This file
```

---

## What Was Built

### 1. Initial Website Scaffolding

- Created 6 HTML pages: Home, About, Services, Contact, Book Consultation, Blog
- Built `config.js` as a centralized content management file
- Built `main.js` with all rendering functions that read from config
- Built `contact.js` with EmailJS integration and mailto fallback
- Built `calendar.js` with Google Calendar OAuth2 flow
- Built `blog.js` with category filtering and single-post URL routing
- Copied logo design files (purple/plum variants) to `images/`

### 2. Design System & Color Scheme

- **Purple/Plum theme** based on the logo design files (Designs 1-4)
- CSS custom properties for all colors, shadows, radii, and typography
- Color palette:
  - `--plum-deep: #4A1A3A`
  - `--plum: #6B2D5B`
  - `--plum-light: #9B5F8B`
  - `--mauve: #C9A0C9`
  - `--lavender: #F3E8F3`
  - `--bg-warm: #FDF8FC`

### 3. Full CSS Redesign (Reference Site Matching)

Analyzed and matched the style/format of 4 reference therapy websites:
- choosekindtherapy.com
- skillsonthehill.com
- lilrascalstherapy.com
- specializedspch.com

Implemented design patterns from those sites:
- **Announcement bar** at top with dismiss functionality (session storage)
- **Full-width hero** with dark gradient overlay and SVG wave bottom
- **Floating decorative circles** with CSS animation in the hero
- **Marquee scrolling text** section with service keywords
- **Split sections** (alternating image + text, like Lil Rascals/Skills on the Hill)
- **Dark plum CTA sections** with quote variant
- **Process/step-by-step grid** with connecting line (3 steps)
- **Pill-shaped buttons** (`border-radius: 100px`)
- **Dark plum contact info sidebar** on the contact page
- **Testimonial cards** with decorative quote marks and hover effects
- **Blog cards** with category badges and metadata
- **Scroll animations:** fade-up, fade-left, fade-right, scale-in with stagger delays
- **Wave SVG dividers** between sections
- **Generous whitespace** and rounded corners throughout
- **Responsive design** with mobile hamburger menu

### 4. Full Content Update (User's Script)

Updated all pages with the user's exact copy/script:

**Homepage (`index.html`):**
- Hero: "Your child doesn't need more pressure. They need the right support."
- 4 feature boxes: In-Home & In-Office, Virtual OT, Parent Coaching, IEP Consulting
- Marquee with service keywords
- "What Makes DunnWell Different" section with Bianca's photo and differentiators checklist
- "Who We Help" dark split section with bullet list
- "How It Works" 3-step process
- "Real Families. Real Stories." testimonials section with video testimonial
- Dark quote CTA
- Blog preview (latest 3 posts)

**About Page (`about.html`):**
- Full bio for Bianca Dunn, MSOT, OTR/L with professional headshot
- Extended bio sections (clinical background, specialties, founding story)
- Education and certifications lists
- Mission statement (dark CTA section)
- Private-pay practice information section
- Service locations grid (Virtual, In-Center, In-Home)

**Services Page (`services.html`):**
- 4 services with alternating image/text layout:
  1. In-Home & In-Office Occupational Therapy
  2. Virtual OT & Executive Function Coaching
  3. Parent Coaching & Consultation
  4. IEP & School Consultation
- "Our Approach" dark split section with evidence-based practices
- "What Parents Can Expect" section with checkmarks
- Private-pay information (replaced old insurance section)

**Contact Page (`contact.html`):**
- Updated form fields: First Name, Last Name, Email, Phone, Child/Client Age, Service of Interest dropdown, State dropdown (VA, DC, FL, TX), City, Message/Goals
- Removed old insurance dropdown (private-pay practice)
- Contact info sidebar with phone, fax, email, address, office hours
- Google Maps embed

**Book Consultation Page (`book.html`):**
- 3 booking methods via tabs:
  1. Simple Practice (primary, with placeholder URL)
  2. Google Calendar (OAuth login flow)
  3. Manual Request Form
- Manual form updated with: Child/Client Age, State, Service of Interest
- Removed insurance dropdown
- "What to Expect" 3-step process section

**Blog Page (`blog.html`):**
- Category filters: All Posts, Education, Pediatric OT, Sensory Processing, Executive Functioning
- 3 starter blog posts in config:
  1. "5 Sensory-Friendly Tips for Your Home Environment"
  2. "What Is Occupational Therapy? A Complete Guide"
  3. "Executive Functioning: What It Is and How OT Helps"
- Single post view with back button

### 5. Bianca's Professional Headshot

- Added `bianca-dunn.png` to the website
- Displayed on the **About page** (bio section, replacing placeholder icon)
- Displayed on the **Homepage** "What Makes DunnWell Different" section
- Styled with decorative offset border and rounded corners

### 6. Video Testimonial

- Copied `Movie on 2-4-26 at 8.07 PM.MOV` to the website
- Converted MOV to MP4 using `avconvert` for broad browser compatibility
- Added to the Homepage testimonials section with video player controls
- Styled with rounded corners and shadow

### 7. Logo Sizing

- Increased nav logo from default 55px to **130px** height
- Nav bar height increased to **140px** to accommodate
- Mobile logo scaled to 70px with 85px nav height
- Ensured logo is clearly visible and prominent

### 8. Book Consultation Button Fix

- Fixed unreadable "Book Consultation" nav button
- Added explicit white text color (`#fff !important`) on plum background
- Added `font-weight: 600` for better legibility
- Ensured hover state also maintains white text

### 9. Admin Panel (Firebase-Powered)

Added a full admin dashboard at `/admin.html` for managing all site content visually, with zero monthly cost (Firebase free tier).

**How it works:**
```
Public Site:  page loads -> Firebase loader fetches Firestore data -> renders (falls back to config.js)
Admin Panel:  /admin.html -> login -> dashboard -> edit content -> saves to Firebase -> live site updates
```

**New files:**
- `admin.html` — Admin dashboard with login, sidebar navigation, and content management UI
- `css/admin.css` — Admin-specific styles matching the DunnWell plum/mauve palette
- `js/firebase-config.js` — Firebase project credentials (user fills in after setup)
- `js/firebase-loader.js` — Loads Firestore data into SITE_CONFIG, falls back to config.js
- `js/admin.js` — Admin CRUD logic, auth, image uploads, Quill.js rich text editor

**Modified files:**
- `js/config.js` — Updated comment noting it's now a fallback
- `js/main.js` — Made async, awaits Firebase loader before rendering
- `js/blog.js` — Made async + added dynamic category filter generation from blog data
- All 6 HTML pages — Added Firebase CDN scripts (App + Firestore), firebase-config.js, firebase-loader.js

**Admin capabilities:**
- **Blog Posts** — Create, edit, delete with rich text editor (Quill.js), featured images, categories
- **Testimonials** — Add, edit, remove client testimonials
- **Services** — Update titles, descriptions, icons, and feature lists
- **About / Bio** — Edit all bio sections, upload new headshot
- **Site Settings** — Update phone, email, address, hours, social links, Google Maps
- **Image Library** — Upload, browse, copy URLs, delete images
- **Import from Config** — One-click button to seed all existing config.js content into Firebase

**Firebase setup (completed):**
- Firebase project: `dunnwelltherapy` (Spark/free plan)
- Authentication: Email/Password enabled, admin account created
- Cloud Firestore: Production rules deployed
- Firebase Storage: Not yet enabled (requires Blaze plan)
- Firebase config: Real credentials in `js/firebase-config.js`
- Admin login: https://dunnwelltherapy.com/admin.html

### 10. Firebase Setup & Deployment

- Created Firebase project "Dunnwelltherapy" on the free Spark plan
- Enabled **Cloud Firestore** with production security rules (public read, authenticated write)
- Enabled **Firebase Authentication** with Email/Password provider
- Created admin user account (care@dunnwelltherapy.com)
- Registered web app and configured `js/firebase-config.js` with real credentials
- **Firebase Storage** skipped for now (requires Blaze plan upgrade). Images are managed by adding files to the `images/` folder and redeploying
- Deployed Firestore security rules via Firebase Console
- Admin panel live at: https://dunnwelltherapy.com/admin.html

### 11. Admin Panel: Full Content Coverage

Extended the admin panel so every piece of website content is editable:

- **Homepage section** (new): Edit hero subtitle, tagline, delivery methods, "What Makes DunnWell Different" checklist, "Who We Help" list
- **Services section** (extended): Edit "Our Approach" list and "What Parents Can Expect" checklist
- **Site Settings** (extended): Edit site name, tagline, service locations (type/icon/description), and service interest dropdown options
- **Import from Config** now imports ALL content including homepage, approach, expectations, service locations, and service interests
- **Firebase Loader** updated to load homepage and services page data from Firestore
- Fixed admin layout CSS bug (double sidebar offset causing squished content)

### 12. Logo Sizing Update

- Increased nav logo to **300px** height across all pages
- Nav bar remains at 140px, logo overflows with `z-index: 10`
- Hero section top padding increased to `14rem` to clear the larger logo
- Admin sidebar logo increased to **250px**

### 13. Footer Credential Logos

Added professional affiliation/credential logos to the footer of all 6 pages:
- **AOTA** (American Occupational Therapy Association)
- **DC Health** (Government of the District of Columbia)
- **Florida Health**
- **Texas Health and Human Services**

White backgrounds removed from AOTA, Florida Health, and Texas HHS using ImageMagick. Logos displayed in a centered row with hover effect above the copyright line.

New image files: `images/aota.png`, `images/dc-health.png`, `images/florida-health.png`, `images/texas-hhs.png`

### 14. Content Polish

- Removed all em dashes (`—`) from visible content across all pages and config
- Replaced with proper punctuation (commas, periods) for clean readability
- Polished Bianca's bio copy for professional flow
- Updated meta descriptions across all pages
- Consistent branding: "DunnWell Therapy, LLC" throughout

---

## Config-Driven Content (`js/config.js`)

All site content is managed from a single file. To update the website, edit `config.js`:

| Section | What It Controls |
|---|---|
| `siteName`, `tagline` | Site branding |
| `phone`, `fax`, `address` | Contact info (footer + contact page) |
| `emailPrimary`, `emailSecondary` | Where contact/booking forms send to |
| `emailjs` | EmailJS API credentials |
| `simplePractice` | Simple Practice booking URL |
| `googleCalendar` | Google Calendar OAuth credentials |
| `social` | Social media links (Facebook, Instagram, LinkedIn) |
| `hours` | Office hours display |
| `serviceLocations` | Virtual/In-Center/In-Home service areas |
| `serviceInterests` | Dropdown options for service of interest |
| `services` | All 4 services (title, description, features) |
| `differentiators` | "What Makes DunnWell Different" checklist |
| `whoWeHelp` | "Who We Help" bullet list |
| `approach` | "Our Approach" evidence-based items |
| `parentExpect` | "What Parents Can Expect" checklist |
| `blogPosts` | All blog posts (add new posts at the top) |
| `testimonials` | Client testimonial quotes |
| `about` | Full bio, education, certifications, mission, payment note |

---

## Placeholder Credentials (Need Real Values)

| Item | Current Value | Where to Get It |
|---|---|---|
| **Firebase Config** | ✅ Configured in `js/firebase-config.js` | Firebase Console > Project Settings > Your Apps > Web |
| EmailJS Public Key | `YOUR_EMAILJS_PUBLIC_KEY` | https://www.emailjs.com |
| EmailJS Service ID | `YOUR_EMAILJS_SERVICE_ID` | EmailJS dashboard |
| EmailJS Contact Template | `YOUR_CONTACT_TEMPLATE_ID` | EmailJS dashboard |
| EmailJS Booking Template | `YOUR_BOOKING_TEMPLATE_ID` | EmailJS dashboard |
| Simple Practice URL | `https://yourpractice.clientsecure.me` | Simple Practice account |
| Simple Practice Widget | `YOUR_WIDGET_ID` | Simple Practice settings |
| Google Calendar Client ID | `YOUR_GOOGLE_CLIENT_ID` | Google Cloud Console |
| Google Calendar API Key | `YOUR_GOOGLE_API_KEY` | Google Cloud Console |
| Primary Email | `contact@dunnwelltherapy.com` | Update with real email |
| Secondary Email | `bookings@dunnwelltherapy.com` | Update with real email |
| Phone | `(555) 123-4567` | Update with real phone |
| Fax | `(555) 123-4568` | Update with real fax |
| Social Media Links | Placeholder URLs | Update with real profiles |
| Google Maps Embed | Arlington, VA generic | Update with exact address |

---

## Hosting & Deployment

### Live Site
- **Production URL:** https://dunnwelltherapy.com
- **Hosted on:** Vercel (free tier)
- **GitHub Repo:** https://github.com/dunnwelltherapy/dunnwelltherapy

### Domain & DNS (Squarespace)
Domain DNS is managed through Squarespace. The following custom records point to Vercel:

| Host | Type | TTL | Data |
|------|------|-----|------|
| `@` | A | 30 mins | `76.76.21.21` |
| `www` | CNAME | 30 mins | `cname.vercel-dns.com` |

Google Workspace email records (MX, TXT/SPF, DKIM) are also configured and should not be modified.

### How to Redeploy After Changes
```bash
cd "/Volumes/Willie Extr/Bianca Dunn/website"
vercel --prod
```

### How to Push Changes to GitHub
```bash
cd "/Volumes/Willie Extr/Bianca Dunn/website"
git add -A && git commit -m "description of changes" && git push
```
Note: GitHub auth is set to the `dunnwelltherapy` account. Vercel deploys are done via CLI (not connected to GitHub).

---

## How to Run Locally

```bash
cd "/Volumes/Willie Extr/Bianca Dunn/website"
python3 -m http.server 8090
```

Then open `http://localhost:8090` in your browser.
