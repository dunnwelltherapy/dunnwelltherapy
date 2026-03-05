# DunnWell Therapy Website — Complete Guide

This guide explains everything about the DunnWell Therapy website. It is written in plain language so that anyone — even without technical experience — can understand how the site works, how to update it, and where everything lives.

---

## TABLE OF CONTENTS

1. [What This Website Is](#1-what-this-website-is)
2. [Where the Website Lives (Hosting)](#2-where-the-website-lives-hosting)
3. [How to Access the Website Files](#3-how-to-access-the-website-files)
4. [All the Pages on the Website](#4-all-the-pages-on-the-website)
5. [The Admin Panel (How to Edit Content)](#5-the-admin-panel-how-to-edit-content)
6. [How the Booking Form Works](#6-how-the-booking-form-works)
7. [How the Contact Form Works](#7-how-the-contact-form-works)
8. [Firebase (The Database)](#8-firebase-the-database)
9. [Google Calendar Integration](#9-google-calendar-integration)
10. [All the Files Explained](#10-all-the-files-explained)
11. [Images on the Website](#11-images-on-the-website)
12. [Accounts & Logins You Need](#12-accounts--logins-you-need)
13. [How to Make Common Changes](#13-how-to-make-common-changes)
14. [How to Deploy (Push Changes Live)](#14-how-to-deploy-push-changes-live)
15. [Clinical Notes Feature](#15-clinical-notes-feature)
16. [Troubleshooting Common Issues](#16-troubleshooting-common-issues)
17. [Important Credentials Reference](#17-important-credentials-reference)

---

## 1. WHAT THIS WEBSITE IS

**DunnWell Therapy** is a website for an occupational therapy practice run by **Bianca Dunn, MSOT, OTR/L**. The website:

- Tells visitors about the therapy services offered
- Lets people book a consultation appointment
- Has a contact form so people can ask questions
- Has a blog with helpful articles about occupational therapy
- Shows testimonials from real families
- Has a private admin panel where Bianca can edit everything

**Website address:** https://dunnwelltherapy.com

**Business info:**
- Phone: (786) 479-3593
- Email: care@dunnwelltherapy.com
- Service areas: Virginia, Washington DC, Florida, Texas
- Services: In-Home OT, Virtual OT, Parent Coaching, IEP Consulting

---

## 2. WHERE THE WEBSITE LIVES (HOSTING)

The website is hosted on **Vercel** — a free website hosting service. Think of Vercel as the "home" where the website files live on the internet.

- **Domain:** dunnwelltherapy.com (connected to Vercel)
- **Cost:** Free
- **Note:** There is no separate Vercel login/dashboard account. Deployments are done from the command line using `npx vercel --prod --yes` (see Section 14)

The website code is also stored on **GitHub** — think of this as a backup/storage locker for all the code.

- **GitHub Repository:** https://github.com/dunnwelltherapy/dunnwelltherapy
- **Cost:** Free

**How they work together:**
1. Website files are stored on GitHub
2. When you push changes to GitHub, Vercel automatically picks them up
3. Vercel puts the updated files online at dunnwelltherapy.com

---

## 3. HOW TO ACCESS THE WEBSITE FILES

The website files are stored on an external drive at:
```
/Volumes/Willie Extr/Bianca Dunn/website/
```

To work on the website, you need:
1. The external drive plugged into your Mac
2. A text editor (like Visual Studio Code, free at https://code.visualstudio.com)
3. A web browser to preview changes

**To preview the site locally (on your computer):**
1. Open Terminal (search "Terminal" in Spotlight)
2. Type: `cd "/Volumes/Willie Extr/Bianca Dunn/website"`
3. Type: `python3 -m http.server 8090`
4. Open your browser and go to: `http://localhost:8090`

---

## 4. ALL THE PAGES ON THE WEBSITE

The website has **7 pages**. Each page is an HTML file:

| Page | File | What It Is |
|---|---|---|
| **Home** | `index.html` | The main landing page visitors see first. Has hero section, features, testimonials, blog preview |
| **About** | `about.html` | Bianca's bio, credentials, education, and the story behind DunnWell |
| **Services** | `services.html` | Lists all 4 service types with details and what parents can expect |
| **Book** | `book.html` | The appointment booking form. When someone fills it out, it adds to Google Calendar |
| **Blog** | `blog.html` | Articles and tips about occupational therapy. Can filter by category |
| **Contact** | `contact.html` | Contact form, office hours, phone, email, and a map |
| **Admin** | `admin.html` | Private dashboard (password-protected) where Bianca edits all website content |

---

## 5. THE ADMIN PANEL (HOW TO EDIT CONTENT)

The admin panel is the most important tool for managing the website. **You do NOT need to edit code** to update most content — just use the admin panel.

### How to get to the admin panel:
1. Go to: **https://dunnwelltherapy.com/admin.html**
2. Log in with your email and password (set up through Firebase)

### What you can edit in the admin panel:

#### Dashboard
- See quick stats (how many blog posts, testimonials, services, images, patients)
- "Import from Config" button — use this the very first time to load all the default content into the database

#### Homepage Content
- The main headline and subtitle
- The "What Makes DunnWell Different" bullet points
- The "Who We Help" bullet points

#### Blog Posts
- **Add new posts:** Click "New Post", write your title, pick a category, write content using the text editor (works like Microsoft Word — bold, italic, headings, lists, images)
- **Edit posts:** Click on any existing post to change it
- **Delete posts:** Click the trash icon (it will ask you to confirm)

#### Testimonials
- **Text testimonials:** Add quotes from families with their name and role
- **Video testimonials:** Add videos by pasting a URL or uploading a video file
- **Delete:** Remove any testimonial you no longer want

#### Services
- Edit the 4 main services (title, description, features list)
- Edit "Our Approach" section
- Edit "What Parents Can Expect" section

#### About / Bio
- Edit Bianca's name, credentials, title, bio text
- Upload or change the headshot photo
- Edit education, certifications, specialties
- Edit the mission statement and founding story

#### Site Settings
- **Contact info:** Phone, email, fax, address
- **Social media:** Facebook, Instagram, LinkedIn links
- **Office hours:** Edit hours for each day of the week
- **Service locations:** Add or remove service areas
- **Google Maps:** Change the embedded map

#### Image Library
- Upload images by dragging them in or clicking to browse
- Supports JPG, PNG, and WebP files up to 5MB each
- Used for blog post images and other content

#### Clinical Notes
- Private feature for documenting patient sessions (see Section 15)

---

## 6. HOW THE BOOKING FORM WORKS

When someone visits the **Book Consultation** page and fills out the form, here's what happens:

1. **Visitor fills out the form** with their name, email, phone, child's age, state, preferred date/time, service type, and notes
2. **They click "Book Consultation"**
3. **The form sends the data** to a Google Apps Script (a small program running on Google's servers)
4. **The Apps Script does 3 things:**
   - Creates an event on Bianca's Google Calendar with all the booking details
   - Sends a **confirmation email** to the person who booked
   - Sends a **notification email** to care@dunnwelltherapy.com so Bianca knows about it

**No sign-in is required** from the visitor. They just fill out the form and submit.

### The Google Apps Script

This is a small program hosted by Google that handles the booking. It lives at:
```
https://script.google.com/macros/s/AKfycbwQUJmmufNyo6wE4_eh5d61P0ySslX4dAhQdR6psu8Sqw_WRSp7Wujl0GtjibeL1A9Snw/exec
```

**To edit the Apps Script:**
1. Go to https://script.google.com
2. Open the "DunnWell Booking" project
3. Edit the code
4. Click **Deploy** → **Manage deployments** → **Edit (pencil icon)** → **New version** → **Deploy**

**Important:** After editing the Apps Script, you MUST create a new version and redeploy, or the changes won't take effect.

---

## 7. HOW THE CONTACT FORM WORKS

The contact form on the **Contact** page works differently from the booking form:

1. **Visitor fills out the form** with their name, email, phone, child's age, service interest, state, and message
2. **The form tries to send via EmailJS** (an email delivery service)
3. **If EmailJS isn't set up**, it falls back to opening the visitor's email app (like Gmail or Outlook) with a pre-written email

### Setting up EmailJS (if not already done):
1. Go to https://www.emailjs.com and create a free account
2. Connect your email service (Gmail, Outlook, etc.)
3. Create a "Contact Form" email template
4. Copy your **Public Key**, **Service ID**, and **Template ID**
5. Update these values in the admin panel under **Site Settings** or in the file `js/config.js`

**Free tier:** 200 emails per month

---

## 8. FIREBASE (THE DATABASE)

Firebase is a free service by Google that stores all the website content. Think of it as a filing cabinet in the cloud.

### What Firebase stores:
- All the text content on the website (services, testimonials, blog posts, etc.)
- Admin user login accounts
- Uploaded images
- Patient/clinical notes
- Video testimonial links

### Firebase Console (where you manage it):
1. Go to https://console.firebase.google.com
2. Select the **dunnwelltherapy** project

### Important sections in Firebase Console:

| Section | What It Does |
|---|---|
| **Authentication** | Manages who can log into the admin panel. Add or remove admin users here |
| **Firestore Database** | Where all the website content is stored. You can view and edit data here directly, but it's easier to use the admin panel |
| **Storage** | Where uploaded images and files are stored |

### Firebase Collections (data groups):

| Collection | What It Stores |
|---|---|
| `settings` | Contact info, hours, social links, homepage content, about page content |
| `services` | The 4 therapy services and their details |
| `blogPosts` | All blog articles |
| `testimonials` | Text testimonials from families |
| `videoTestimonials` | Video testimonial URLs |
| `patients` | Patient info for clinical notes |
| `clinicalNotes` | Session notes for patients |

### How it works with the website:
1. When someone visits the website, it first tries to load content from Firebase
2. If Firebase is unavailable (internet is down, etc.), it falls back to the default content in `config.js`
3. When you update content in the admin panel, it saves to Firebase
4. The next visitor to the site sees the updated content

---

## 9. GOOGLE CALENDAR INTEGRATION

### What it does:
When someone books an appointment through the website, an event is automatically created on Bianca's Google Calendar.

### Google Cloud Console credentials:
- **API Key:** AIzaSyBR05wTUI6F6Pn8KFS4_girzlztDQk08fA
- **Client ID:** 1090467909421-u5aklg5d82vvs966ck0c353ntesfek3f.apps.googleusercontent.com

### Where to manage it:
- **Google Cloud Console:** https://console.cloud.google.com
- **Apps Script:** https://script.google.com (look for "DunnWell Booking" project)

---

## 10. ALL THE FILES EXPLAINED

Here's every file in the project and what it does:

### HTML Files (the pages)
| File | Purpose |
|---|---|
| `index.html` | Homepage |
| `about.html` | About Bianca page |
| `services.html` | Services page |
| `book.html` | Booking form page |
| `blog.html` | Blog listing page |
| `contact.html` | Contact page |
| `admin.html` | Admin dashboard (private) |

### JavaScript Files (the brains)
| File | Purpose |
|---|---|
| `js/config.js` | All the default website content. If Firebase is down, the site uses this. Also stores API keys and email settings |
| `js/firebase-config.js` | The connection info for Firebase (like a password to access the database) |
| `js/firebase-loader.js` | Loads content from Firebase and puts it on the page. If Firebase fails, falls back to config.js |
| `js/main.js` | The main code that builds every page — navigation, footer, testimonials, blog previews, animations |
| `js/admin.js` | All the admin panel code — login, editing content, uploading images, managing patients |
| `js/calendar.js` | Handles the booking form — sends data to Google Apps Script |
| `js/contact.js` | Handles the contact form — sends emails via EmailJS |
| `js/blog.js` | Blog page code — displays posts, handles filtering by category, individual post view |

### CSS Files (the design)
| File | Purpose |
|---|---|
| `css/styles.css` | All the visual styling for the public website — colors, fonts, layout, spacing, mobile responsive design |
| `css/admin.css` | All the visual styling for the admin panel |

### Other Files
| File | Purpose |
|---|---|
| `CHANGELOG.md` | A detailed log of everything that was built and changed |
| `HANDOFF-GUIDE.md` | This file — the complete guide you're reading now |

---

## 11. IMAGES ON THE WEBSITE

All images are in the `images/` folder:

| Image | Where It's Used |
|---|---|
| `logo-full.png` | The main logo (with tagline) — used in the nav bar and footer on every page |
| `logo-no-tagline.png` | Logo without tagline (backup version) |
| `logo-text-only.png` | Text-only logo (backup version) |
| `logo-icon.png` | Just the lotus icon (backup version) |
| `bianca-dunn.png` | Bianca's professional headshot — used on the homepage and about page |
| `children-playing.png` | Photo of kids running outdoors — used in the "Who We Help" section on the homepage |
| `parents-kids.png` | Photo of parents and kids playing — used in the "What Parents Can Expect" section on services page |
| `aota.png` | AOTA credential logo — shown in the footer |
| `dc-health.png` | DC Health credential logo — shown in the footer |
| `florida-health.png` | Florida Health credential logo — shown in the footer |
| `texas-hhs.png` | Texas HHS credential logo — shown in the footer |
| `testimonial-video.mp4` | First video testimonial |
| `testimonial-video-2.mp4` | Second video testimonial |

---

## 12. ACCOUNTS & LOGINS YOU NEED

Here are all the accounts connected to this website:

| Service | What It's For | Login URL |
|---|---|---|
| **GitHub** | Code storage/backup | https://github.com |
| **Firebase** | Database, auth, storage | https://console.firebase.google.com |
| **Google Cloud Console** | Calendar API keys | https://console.cloud.google.com |
| **Google Apps Script** | Booking automation | https://script.google.com |
| **EmailJS** | Contact form emails | https://www.emailjs.com |
| **Domain Registrar** | dunnwelltherapy.com domain | (wherever the domain was purchased) |

**Note:** There is no Vercel account/login. Deployments are done via the command line (see Section 14).

### Admin Panel Login:
- **URL:** https://dunnwelltherapy.com/admin.html
- **How to create a new admin user:**
  1. Go to Firebase Console → Authentication → Users tab
  2. Click "Add User"
  3. Enter an email and password
  4. That person can now log into the admin panel

---

## 13. HOW TO MAKE COMMON CHANGES

### Change the phone number or email:
1. Log into the admin panel → **Settings**
2. Update the phone/email fields
3. Click **Save Settings**
4. The website will show the new info immediately

### Add a new blog post:
1. Log into the admin panel → **Blog Posts**
2. Click **"New Post"**
3. Fill in the title, pick a category, write the content
4. Click **Save**
5. The post appears on the blog page immediately

### Add a new testimonial:
1. Log into the admin panel → **Testimonials**
2. Click **"Add Testimonial"**
3. Type the quote, person's name, and their role (e.g., "Parent")
4. Click **Save**

### Add a video testimonial:
1. Log into the admin panel → **Testimonials**
2. Scroll down to **Video Testimonials**
3. Either paste a video URL or upload a video file
4. Click **Add**

### Change the office hours:
1. Log into the admin panel → **Settings**
2. Scroll to **Office Hours**
3. Edit the hours for any day
4. Click **Save Settings**

### Update Bianca's bio or photo:
1. Log into the admin panel → **About / Bio**
2. Edit any text fields
3. To change the photo, click the upload area and select a new image
4. Click **Save**

### Change social media links:
1. Log into the admin panel → **Settings**
2. Scroll to **Social Media**
3. Update the Facebook, Instagram, or LinkedIn URLs
4. Click **Save Settings**

---

## 14. HOW TO DEPLOY (PUSH CHANGES LIVE)

If someone edits the actual code files (HTML, CSS, or JavaScript), those changes need to be "deployed" (pushed live). Here's how:

### Option A: Using the Terminal (command line)
1. Open **Terminal** on your Mac
2. Navigate to the project:
   ```
   cd "/Volumes/Willie Extr/Bianca Dunn/website"
   ```
3. Add the changed files:
   ```
   git add .
   ```
4. Save the changes with a message:
   ```
   git commit -m "Description of what you changed"
   ```
5. Push to GitHub:
   ```
   git push origin main
   ```
6. Deploy to Vercel:
   ```
   npx vercel --prod --yes
   ```

### Option B: Automatic
If the GitHub repository is connected to Vercel (it should be), simply pushing to GitHub (step 5) will automatically deploy the site. The Vercel deploy command (step 6) is a manual backup method.

### Important notes:
- **Changes made in the admin panel** do NOT require deployment — they save directly to Firebase and show up immediately
- **Changes to actual code files** (HTML, CSS, JS) DO require deployment
- Always test locally before deploying (see Section 3)

---

## 15. CLINICAL NOTES FEATURE

The admin panel has a private **Clinical Notes** section for documenting patient therapy sessions. This is only visible to logged-in admin users — it does NOT appear on the public website.

### How it works:

#### Managing Patients:
1. Go to admin panel → **Clinical Notes**
2. Click **"New Patient"** to add a patient
3. Fill in: First Name, Last Name, Date of Birth, Guardian Name, Phone, Email, Diagnosis
4. Set status to **Active** or **Discharged**
5. Click **Save**

#### Writing Session Notes:
1. Click on a patient in the left sidebar
2. Click **"New Note"**
3. Choose the note type:
   - **SOAP** — 4 sections: Subjective (what patient/parent reports), Objective (what you observed), Assessment (your clinical reasoning), Plan (next steps)
   - **Narrative** — One open text field for free-form notes
   - **Progress** — One open text field for progress updates
4. Fill in the date, duration, and note content
5. Notes **auto-save** every 2 seconds as you type (you'll see "Saving..." then "Saved" at the top)

#### Other features:
- **Search patients** by name using the search bar
- **Filter patients** by Active, Discharged, or All
- **Email a note** — Click "Email Note" to open your email app with the note pre-formatted
- **Mark as Final** — Lock a note so it can't be accidentally edited
- **Delete notes** — Remove notes you no longer need

---

## 16. TROUBLESHOOTING COMMON ISSUES

### "The website looks the same after I made changes in the admin panel"
- Try **hard refreshing** your browser: press **Cmd + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows)
- Wait 10-15 seconds and refresh again — Firebase sometimes takes a moment

### "I can't log into the admin panel"
- Make sure you're using the correct email and password
- Go to Firebase Console → Authentication → Users to verify the account exists
- Click "Reset Password" in Firebase if you forgot it

### "The booking form isn't creating calendar events"
- Check that the Google Apps Script is still deployed at https://script.google.com
- Make sure the deployment is set to **"Anyone"** access (not just organization members)
- If you changed the script, redeploy with a **New Version**

### "Images aren't showing up"
- Make sure the image file is in the `images/` folder
- Check that the file name matches exactly (including capitalization)
- Image files should be PNG, JPG, or WebP format

### "The contact form isn't sending emails"
- EmailJS may not be set up yet — check if the credentials are filled in under `js/config.js`
- If using the free tier, you may have hit the 200 emails/month limit
- The fallback is a mailto: link, which opens the visitor's email app

### "I accidentally broke something"
- All code is backed up on GitHub. You can go to https://github.com/dunnwelltherapy/dunnwelltherapy and see previous versions
- In Terminal, run `git log` to see recent changes, and `git checkout -- filename` to undo changes to a specific file

---

## 17. IMPORTANT CREDENTIALS REFERENCE

### Firebase Project
- **Project ID:** dunnwelltherapy
- **API Key:** AIzaSyBI-DVKipZJ38ZHiFRG3LvD0U4kAAcPa-g
- **Auth Domain:** dunnwelltherapy.firebaseapp.com

### Google Calendar
- **API Key:** AIzaSyBR05wTUI6F6Pn8KFS4_girzlztDQk08fA
- **Client ID:** 1090467909421-u5aklg5d82vvs966ck0c353ntesfek3f.apps.googleusercontent.com

### Google Apps Script (Booking)
- **URL:** https://script.google.com/macros/s/AKfycbwQUJmmufNyo6wE4_eh5d61P0ySslX4dAhQdR6psu8Sqw_WRSp7Wujl0GtjibeL1A9Snw/exec

### Contact Info (on the website)
- **Email:** care@dunnwelltherapy.com
- **Phone:** (786) 479-3593
- **Address:** Arlington / Alexandria, Virginia

### Design Colors
The website uses a purple/plum color theme:
- Dark plum: #4A1A3A
- Plum: #6B2D5B
- Light plum: #9B5F8B
- Mauve: #C9A0C9
- Lavender: #F3E8F3
- Warm background: #FDF8FC

### Fonts
- **Headings:** Playfair Display (elegant serif font)
- **Body text:** Inter (clean, modern font)
- **Icons:** Font Awesome 6.5.1

---

*Last updated: March 4, 2026*
*Created by Willie Austin with Claude Code*
