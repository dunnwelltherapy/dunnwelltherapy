# DunnWell Therapy Website — Complete Guide

This guide explains absolutely everything about the DunnWell Therapy website. It is written so that someone with zero computer or coding experience can understand how the site works, how to update it, and where everything lives. Nothing is assumed — every step is spelled out.

---

## TABLE OF CONTENTS

1. [What This Website Is](#1-what-this-website-is)
2. [Important Words You'll See in This Guide](#2-important-words-youll-see-in-this-guide)
3. [Where the Website Lives (Hosting)](#3-where-the-website-lives-hosting)
4. [How to Access the Website Files](#4-how-to-access-the-website-files)
5. [What is Terminal and How to Use It](#5-what-is-terminal-and-how-to-use-it)
6. [All the Pages on the Website](#6-all-the-pages-on-the-website)
7. [The Admin Panel (How to Edit Content Without Coding)](#7-the-admin-panel-how-to-edit-content-without-coding)
8. [How the Booking Form Works](#8-how-the-booking-form-works)
9. [How the Contact Form Works](#9-how-the-contact-form-works)
10. [Firebase — The Database That Stores Everything](#10-firebase--the-database-that-stores-everything)
11. [Google Calendar Integration](#11-google-calendar-integration)
12. [All the Files Explained (What Every File Does)](#12-all-the-files-explained-what-every-file-does)
13. [Images on the Website](#13-images-on-the-website)
14. [Accounts and Logins You Need](#14-accounts-and-logins-you-need)
15. [How to Make Common Changes (Step-by-Step)](#15-how-to-make-common-changes-step-by-step)
16. [How to Deploy — Pushing Code Changes to the Live Website](#16-how-to-deploy--pushing-code-changes-to-the-live-website)
17. [How to Edit Code Files (For Advanced Changes)](#17-how-to-edit-code-files-for-advanced-changes)
18. [Clinical Notes Feature (Private — Admin Only)](#18-clinical-notes-feature-private--admin-only)
19. [Troubleshooting — What to Do When Something Goes Wrong](#19-troubleshooting--what-to-do-when-something-goes-wrong)
20. [All Credentials and Keys in One Place](#20-all-credentials-and-keys-in-one-place)

---

## 1. WHAT THIS WEBSITE IS

**DunnWell Therapy** is a professional website for an occupational therapy practice. Here is what it does:

- **Shows visitors** what services are offered (In-Home OT, Virtual OT, Parent Coaching, IEP Consulting)
- **Lets people book appointments** — they fill out a form and it automatically goes onto a Google Calendar
- **Has a contact form** — people can send a message with questions
- **Has a blog** — articles and tips about occupational therapy that Bianca writes
- **Shows testimonials** — quotes and videos from real families who have used the services
- **Has a private admin panel** — a hidden dashboard where you can change all the content on the website without touching any code

**Who runs it:** Bianca Dunn, MSOT, OTR/L (Licensed Occupational Therapist)

**Website address:** https://dunnwelltherapy.com
*(This is what you type into your browser to see the website)*

**Business contact info:**
- Phone: (786) 479-3593
- Email: care@dunnwelltherapy.com
- Service areas: Virginia, Washington DC, Florida, Texas

---

## 2. IMPORTANT WORDS YOU'LL SEE IN THIS GUIDE

If you're new to computers and websites, here are some words explained in plain English:

| Word | What It Means |
|---|---|
| **Website** | A collection of pages on the internet that people can visit by typing an address (like dunnwelltherapy.com) into their browser |
| **Browser** | The app you use to visit websites — Safari, Google Chrome, Firefox, etc. |
| **URL** | A web address, like `https://dunnwelltherapy.com`. You type these into your browser's address bar |
| **HTML** | The language used to write web pages. HTML files end in `.html`. Think of it as the skeleton/structure of a page |
| **CSS** | The language used to make web pages look pretty — colors, fonts, spacing, layouts. CSS files end in `.css` |
| **JavaScript (JS)** | The language that makes web pages do things — like showing/hiding content, submitting forms, loading data. JS files end in `.js` |
| **Server** | A computer somewhere on the internet that stores your website files and shows them to visitors |
| **Hosting** | The service that keeps your website online and accessible. Ours is Vercel (free) |
| **Domain** | The name people type to visit your site — `dunnwelltherapy.com`. This is purchased separately from hosting |
| **Deploy** | The process of uploading your files to the server so the live website gets updated |
| **Database** | A place where information is stored and organized. Ours is Firebase (free). Think of it like a digital filing cabinet |
| **Terminal** | An app on your Mac where you type commands instead of clicking buttons (more on this in Section 5) |
| **Git** | A tool that tracks changes to files. Think of it like "Track Changes" in Microsoft Word, but for all your code files |
| **GitHub** | A website (github.com) where your code is backed up online. Like Google Drive but specifically for code |
| **Repository (repo)** | A project folder on GitHub. Ours is at `github.com/dunnwelltherapy/dunnwelltherapy` |
| **Commit** | Saving a snapshot of your changes with a description of what you did |
| **Push** | Uploading your saved changes from your computer to GitHub |
| **API** | A way for two computer programs to talk to each other. For example, our website talks to Google Calendar through an API |
| **API Key** | A password-like code that lets your website access an outside service (like Google Calendar) |
| **Firebase** | A free Google service we use to store website content, manage logins, and store images |
| **Firestore** | The specific part of Firebase that stores data (like a database) |
| **Admin Panel** | A private, password-protected page where you edit website content without touching code |
| **Responsive** | The website automatically adjusts its layout to look good on phones, tablets, and computers |
| **Placeholder** | Temporary fake data (like a fake phone number) that needs to be replaced with real information |

---

## 3. WHERE THE WEBSITE LIVES (HOSTING)

Your website needs to live somewhere on the internet so people can visit it. Here's how it's set up:

### Vercel (where the website is hosted)
- **What it is:** A free service that stores your website files and serves them to visitors
- **Website address:** dunnwelltherapy.com points to Vercel
- **Cost:** Free
- **There is NO Vercel login or dashboard.** Everything is done through the Terminal command line (explained in Section 5). When you want to update the live site, you type a command and Vercel handles the rest.

### GitHub (where the code is backed up)
- **What it is:** An online backup of all your website code. Think of it like Google Drive, but for code
- **Where to see it:** https://github.com/dunnwelltherapy/dunnwelltherapy
- **Cost:** Free
- **Why it matters:** If your computer crashes or the external drive breaks, you can download all the code from GitHub

### How they work together:
```
Your Computer (external drive)
        ↓ (you push changes)
     GitHub (online backup)
        ↓ (you deploy)
     Vercel (live website)
        ↓
  dunnwelltherapy.com (what visitors see)
```

---

## 4. HOW TO ACCESS THE WEBSITE FILES

All the website files are stored on an **external hard drive**. The path (address) to the files is:
```
/Volumes/Willie Extr/Bianca Dunn/website/
```

### What you need to work on the website:

1. **The external hard drive** — Plug it into your Mac's USB port. It should show up on your desktop or in Finder as "Willie Extr"

2. **A text editor** — This is an app for editing code files. We recommend **Visual Studio Code** (free):
   - Download it at: https://code.visualstudio.com
   - Click the big blue download button
   - Open the downloaded file and drag it to your Applications folder
   - Now you can open it from your Applications folder or Spotlight (Cmd + Space, type "Visual Studio Code")

3. **A web browser** — Safari (comes with your Mac), Google Chrome, or Firefox. You already have this.

### How to find the files in Finder:
1. Plug in the external drive
2. Open **Finder** (the blue smiley face icon in your dock — the bar of icons at the bottom of your screen)
3. In the left sidebar of Finder, click **Willie Extr** (the external drive name)
4. Double-click the **Bianca Dunn** folder
5. Double-click the **website** folder
6. You'll see all the files — `index.html`, `about.html`, the `css/` folder, the `js/` folder, the `images/` folder, etc.

### How to open a file for editing:
1. Find the file in Finder (see above)
2. Right-click on it (press Control and click, or tap with two fingers on the trackpad)
3. In the menu that appears, click **Open With** → **Visual Studio Code** (or your text editor)
4. The file opens and you can see and edit the code

---

## 5. WHAT IS TERMINAL AND HOW TO USE IT

### What is Terminal?
Terminal is an app that comes with every Mac. It's a text-based way to control your computer. Instead of clicking buttons and icons, you type commands. It looks like a window with text and a blinking cursor.

**You will need Terminal for:**
- Previewing the website on your computer before making it live
- Deploying (uploading) code changes to the live website
- Pushing code backups to GitHub

**You do NOT need Terminal for:**
- Editing content through the admin panel (blog posts, testimonials, settings, etc.) — that's all done in your web browser

### How to open Terminal:
1. Look at your keyboard and find the **Cmd key** — it's the key with the ⌘ symbol, right next to the space bar
2. Hold down **Cmd** and press the **Space bar** at the same time
3. A search bar appears at the top of your screen — this is called **Spotlight**
4. Type the word **Terminal** (you don't need to click anywhere first — just start typing)
5. You'll see "Terminal" appear in the search results
6. Press **Enter** (the big key on the right side of your keyboard, also called "Return")
7. A window opens — it will have either a white or dark background with text and a blinking cursor
8. **This is Terminal!** The blinking cursor is where you type commands.

### How Terminal works — the basics:
- You type a command using your keyboard
- You press **Enter** to run the command
- Terminal shows you the result (or shows nothing if it worked silently)
- Then you type the next command and press **Enter** again
- **Commands are case-sensitive** — typing `CD` is NOT the same as `cd`. Always match the exact uppercase/lowercase shown in this guide.
- **Spaces matter** — `git status` (with a space) is correct. `gitstatus` (no space) won't work.
- **You must type commands exactly as shown** — every space, quote mark, period, and slash matters

### Important keyboard shortcuts for Terminal:
| What to Press | What It Does |
|---|---|
| **Enter** (or Return) | Runs the command you just typed |
| **Ctrl + C** | Stops whatever Terminal is currently doing (useful if something seems stuck) |
| **Cmd + K** | Clears the screen (just makes it look cleaner — doesn't delete anything) |
| **Up Arrow** | Shows the last command you typed (so you don't have to retype it) |
| **Cmd + V** | Pastes text you've copied (works the same as in other apps) |

### Your first Terminal commands explained:

**`cd` — Change Directory (go to a folder)**
```
cd "/Volumes/Willie Extr/Bianca Dunn/website"
```
This tells Terminal to go to the website folder. It's exactly like double-clicking folders in Finder to navigate somewhere. The quotes are needed because some folder names have spaces in them.

**`ls` — List (show what's in this folder)**
```
ls
```
This shows you all the files and folders in whatever folder you're currently in. It's like looking at the contents of a folder in Finder. You'll see things like `index.html`, `about.html`, `css`, `js`, `images`.

**`pwd` — Print Working Directory (where am I?)**
```
pwd
```
This tells you what folder Terminal is currently in. If you followed the `cd` command above, it should show: `/Volumes/Willie Extr/Bianca Dunn/website`

**`clear` — Clear the screen**
```
clear
```
This just wipes the Terminal screen clean. It doesn't delete anything — it just makes the window less cluttered.

### How to preview the website on your computer:
This lets you see the website on your own Mac before putting changes online. Very useful for checking that your changes look right.

1. **Open Terminal** (Cmd + Space → type "Terminal" → press Enter)

2. **Go to the website folder** — type this and press Enter:
   ```
   cd "/Volumes/Willie Extr/Bianca Dunn/website"
   ```

3. **Start a local web server** — type this and press Enter:
   ```
   python3 -m http.server 8090
   ```
   You should see something like: `Serving HTTP on :: port 8090 ...`

   The Terminal will look like it's frozen — **this is normal!** It's running the server in the background. Don't close Terminal.

4. **Open your web browser** (Safari, Chrome, etc.)

5. **In the address bar** (the long bar at the top where you normally type website addresses), type:
   ```
   http://localhost:8090
   ```
   and press Enter

6. **You should see the website!** Click around and check all the pages.

7. **When you're done**, go back to Terminal and press **Ctrl + C** (hold Control and press C) to stop the server.

---

## 6. ALL THE PAGES ON THE WEBSITE

The website has **7 pages**. Each page is a separate file ending in `.html`:

### Homepage — `index.html`
- The first page visitors see when they go to dunnwelltherapy.com
- Contains: announcement bar at the top, big hero section with headline, 4 feature boxes (In-Home, Virtual, Parent Coaching, IEP), scrolling marquee, "What Makes DunnWell Different" section with Bianca's photo, "Who We Help" section with children's photo, "How It Works" 3-step process, testimonials with videos, motivational quote, blog preview, and the footer

### About Page — `about.html`
- All about Bianca — professional headshot, bio, credentials (MSOT, OTR/L), education, certifications, specialties, the story of founding DunnWell, and mission statement

### Services Page — `services.html`
- Lists all 4 services with full descriptions and features:
  1. In-Home & In-Office Occupational Therapy
  2. Virtual OT & Executive Function Coaching
  3. Parent Coaching & Consultation
  4. IEP & School Consultation
- Also shows "Our Approach" and "What Parents Can Expect" with the parents/kids photo

### Book Consultation Page — `book.html`
- A single form where visitors can request an appointment
- Fields: First Name, Last Name, Email, Phone, Child's Age, State, Preferred Date, Preferred Time, Service Type, and Notes
- When submitted, it automatically creates a Google Calendar event and sends confirmation emails

### Blog Page — `blog.html`
- Shows all blog articles in a grid layout with titles, dates, categories, and short previews
- Visitors can filter articles by category (e.g., "Sensory Processing", "Education")
- Clicking on an article shows the full content

### Contact Page — `contact.html`
- Contact form (name, email, phone, age, service interest, state, message)
- Shows office hours, phone number, and email
- Embedded Google Map showing the service area

### Admin Dashboard — `admin.html`
- **This page is NOT visible to regular visitors** — it requires a password to get in
- This is where you edit all website content without coding (explained in detail in Section 7)
- URL: https://dunnwelltherapy.com/admin.html

---

## 7. THE ADMIN PANEL (HOW TO EDIT CONTENT WITHOUT CODING)

The admin panel is the most important tool for managing the website. **You do NOT need to know how to code.** You log in, click on what you want to change, edit it, and click Save. It's like using a simple app.

### How to get to the admin panel:

1. Open your web browser (Safari, Chrome, etc.)
2. Click in the **address bar** at the very top of the browser window (where it shows the current website address)
3. Type: **https://dunnwelltherapy.com/admin.html**
4. Press **Enter**
5. You'll see a login screen with two fields: Email and Password
6. Type in your admin email address in the Email field
7. Type in your password in the Password field
8. Click the **Sign In** button
9. You're now in the admin panel!

*If you don't have login credentials yet, see Section 14 for how to create an admin account.*

### What the admin panel looks like:
- On the **left side**, there's a vertical menu (called a "sidebar") with clickable section names: Dashboard, Homepage, Blog Posts, Testimonials, Services, About/Bio, Settings, Image Library, Clinical Notes
- On the **right side** is the main content area that changes depending on which section you clicked

### Section-by-section guide:

#### Dashboard (the home screen)
This is what you see first after logging in. It shows:
- **Quick stats** — Numbers showing how many blog posts, testimonials, services, images, and patients you have
- **"Import from Config" button** — Click this **THE VERY FIRST TIME** you use the admin panel. It loads all the default content into the database. You only need to do this once ever. If content is already loaded, you don't need to click it again.

#### Homepage Content
Click **"Homepage"** in the left sidebar. Here you can edit:
- **Subtitle** — The small text that appears above the main headline on the homepage
- **Hero Tagline** — The big headline text visitors see first
- **Delivery Methods** — The text that says "In-home • Virtual • School & IEP Consulting"
- **Differentiators** — The bullet points under "What Makes DunnWell Different." You can add new ones, edit existing ones, reorder them, or remove them
- **Who We Help** — The bullet points under "Who We Help." Same editing options.

After making changes, click the **Save** button at the bottom of the section.

#### Blog Posts
Click **"Blog Posts"** in the sidebar.

**To add a new blog post:**
1. Click the **"New Post"** button (usually in the top right)
2. A form appears with these fields:
   - **Title** — The headline of your article (e.g., "5 Tips for Sensory Regulation at Home")
   - **Category** — Pick or type a category (e.g., "Sensory Processing", "Education", "Executive Functioning")
   - **Date** — Click to pick the publish date
   - **Author** — Type the author name (usually "Bianca Dunn, MSOT, OTR/L")
   - **Excerpt** — Write 1-2 sentences that will appear as a preview on the blog listing page
   - **Featured Image** — Paste a URL to an image, or upload one from your computer
   - **Content** — This is where you write the full article. There's a toolbar at the top with buttons:
     - **B** = Make text **bold**
     - **I** = Make text *italic*
     - **H1, H2** = Make text into headings (big text)
     - The list icon = Create bullet points
     - The number icon = Create numbered lists
     - The link icon = Make text clickable (a hyperlink)
     - The image icon = Insert a photo into the article
3. Click **Save**
4. The post immediately appears on the blog page for visitors to see!

**To edit a post:** Click on its title or the pencil icon. Make changes. Click Save.
**To delete a post:** Click the trash icon. It asks "Are you sure?" — click Confirm.

#### Testimonials
Click **"Testimonials"** in the sidebar.

**Text testimonials:**
1. Click **"Add Testimonial"**
2. Type the **quote text** (what the family said)
3. Type the **person's name** (e.g., "Sarah M.")
4. Type their **role** (e.g., "Parent", "Mother of two")
5. Click **Save**

**Video testimonials:**
1. Scroll down to the **Video Testimonials** section
2. To add by URL: Paste the video's web address in the URL field and click **Add**
3. To upload: Click the upload area and select a video file from your computer (.mp4 or .mov format)
4. To delete a video: Click the trash icon next to it

#### Services
Click **"Services"** in the sidebar.
- Edit each of the 4 services: title, icon, short description, full description, and the features list
- Edit the **"Our Approach"** bullet points
- Edit the **"What Parents Can Expect"** bullet points
- Click **Save** after making changes

#### About / Bio
Click **"About / Bio"** in the sidebar.
- Edit: Name, Credentials, Title, Main Bio, Extended Bio, Specialties, Founding Story, Mission, Payment Info
- **Education:** Type each degree on its own line
- **Certifications:** Type each certification on its own line
- **Headshot photo:** Click the upload area to select a new photo from your computer
- Click **Save** after making changes

#### Site Settings
Click **"Settings"** in the sidebar. This is where you change business information:
- **Site Name** — "DunnWell Therapy, LLC"
- **Tagline** — "Therapy, Dunn Well."
- **Phone** — (786) 479-3593
- **Fax** — Currently empty
- **Primary Email** — care@dunnwelltherapy.com
- **Secondary Email** — care@dunnwelltherapy.com
- **Address** — Arlington / Alexandria, Virginia
- **Social Media Links** — Facebook, Instagram, LinkedIn URLs
- **Office Hours** — Editable for each day (Monday through Sunday)
- **Service Locations** — Add or remove service areas
- **Service Interest Options** — The dropdown choices people see on forms
- **Google Maps Embed URL** — The map on the contact page

Click **Save Settings** after making any changes. Changes appear on the website immediately.

#### Image Library
Click **"Image Library"** in the sidebar.
- **To upload:** Drag image files from your computer into the upload area, OR click the upload area to browse your files
- Supported types: JPG, PNG, WebP (these are common image formats)
- Maximum size: 5MB per image
- Uploaded images appear in a grid and can be used in blog posts

#### Clinical Notes
Click **"Clinical Notes"** in the sidebar. This is a private section for patient therapy session documentation. See Section 18 for full details.

---

## 8. HOW THE BOOKING FORM WORKS

When a visitor goes to the Book Consultation page and fills out the form, here's exactly what happens:

### What the visitor sees:
1. They fill out the form: First Name, Last Name, Email, Phone, Child's Age, State, Date, Time, Service Type, Notes
2. They click the **"Book Consultation"** button
3. The button shows a spinning icon and says "Booking..."
4. After a few seconds, a green message appears: "Your booking request has been sent!"
5. The form clears itself automatically

### What happens behind the scenes (invisible to the visitor):
1. The website packages up all the form data
2. It sends that data to a **Google Apps Script** — a small program that runs on Google's servers
3. The Apps Script does 3 things automatically:
   - **Creates a calendar event** on Bianca's Google Calendar with all the appointment details
   - **Sends a confirmation email** to the visitor (telling them their appointment is scheduled)
   - **Sends a notification email** to care@dunnwelltherapy.com so Bianca knows someone booked

### The Google Apps Script:
This is the program that does the work. Its address is:
```
https://script.google.com/macros/s/AKfycbwQUJmmufNyo6wE4_eh5d61P0ySslX4dAhQdR6psu8Sqw_WRSp7Wujl0GtjibeL1A9Snw/exec
```

**To edit the Apps Script (if you ever need to):**
1. Open your browser and go to: **https://script.google.com**
2. Sign in with the Google account that owns the project
3. Click on **"DunnWell Booking"**
4. You'll see the code — make your changes
5. **You MUST redeploy after editing:**
   - Click **Deploy** in the top menu
   - Click **Manage deployments**
   - Click the **pencil icon** (small pencil button)
   - Under **Version**, click the dropdown and select **New version**
   - Click **Deploy**

---

## 9. HOW THE CONTACT FORM WORKS

The contact form (on the Contact page) is separate from the booking form.

### What happens when someone submits it:
1. They fill out: Name, Email, Phone, Age, Service Interest, State, Message
2. They click **Submit**
3. The website tries to send via **EmailJS** (an email delivery service)
4. If EmailJS is set up: The message arrives in the care@dunnwelltherapy.com inbox
5. If EmailJS is NOT set up: The visitor's email app opens (Gmail, Apple Mail, etc.) with the message pre-written — they just click Send

### Setting up EmailJS (if not already working):
1. Go to **https://www.emailjs.com** in your browser
2. Click **Sign Up** and create a free account (200 emails/month free)
3. Click **Email Services** → **Add New Service** → Choose **Gmail** → Connect your Gmail account → Name it "DunnWell" → Click **Create Service** → Write down the **Service ID**
4. Click **Email Templates** → **Create New Template** → Set Subject to `New Contact from {{from_name}}` → In the body add `{{from_name}}`, `{{from_email}}`, `{{message}}` → Click **Save** → Write down the **Template ID**
5. Click your **account icon** (top right) → **Account** → copy the **Public Key**
6. Open the file `js/config.js` in a text editor → find the `emailJS` section → replace the placeholder values with your Service ID, Template ID, and Public Key → Save the file → Deploy (Section 16)

---

## 10. FIREBASE — THE DATABASE THAT STORES EVERYTHING

### What is Firebase?
Firebase is a free service by Google. It stores all the website's content — like a digital filing cabinet in the cloud. When you edit something in the admin panel, it saves to Firebase. When a visitor loads the website, it reads from Firebase.

### What's in each "drawer" (collection):

| Drawer Name | What's Inside |
|---|---|
| **settings** | Phone, email, address, hours, social links, homepage text, about page text |
| **services** | The 4 therapy services with descriptions and features |
| **blogPosts** | All blog articles |
| **testimonials** | Text quotes from families |
| **videoTestimonials** | Video testimonial links |
| **patients** | Patient info for clinical notes |
| **clinicalNotes** | Session notes for patients |

### How to access Firebase directly:
1. Go to: **https://console.firebase.google.com**
2. Sign in with the Google account that owns the project
3. Click on **dunnwelltherapy**
4. Key sections:
   - **Authentication** — Manage admin user accounts
   - **Firestore Database** — View/edit stored content
   - **Storage** — View uploaded images and files

### The backup system:
If Firebase ever goes down (rare), the website automatically uses backup content stored in a file called `js/config.js`. The site never goes completely blank.

---

## 11. GOOGLE CALENDAR INTEGRATION

When someone submits the booking form, an event appears on Bianca's Google Calendar automatically.

### Credentials:
- **API Key:** `AIzaSyBR05wTUI6F6Pn8KFS4_girzlztDQk08fA`
- **Client ID:** `1090467909421-u5aklg5d82vvs966ck0c353ntesfek3f.apps.googleusercontent.com`

### Where to manage:
- **Google Cloud Console:** https://console.cloud.google.com
- **Apps Script:** https://script.google.com → "DunnWell Booking" project

---

## 12. ALL THE FILES EXPLAINED (WHAT EVERY FILE DOES)

### Folder structure:
```
website/
├── index.html          ← Homepage
├── about.html          ← About page
├── services.html       ← Services page
├── book.html           ← Booking form
├── blog.html           ← Blog page
├── contact.html        ← Contact page
├── admin.html          ← Admin panel (private)
├── CHANGELOG.md        ← History of what was built
├── HANDOFF-GUIDE.md    ← This guide
├── css/
│   ├── styles.css      ← Visual design for the public site
│   └── admin.css       ← Visual design for the admin panel
├── js/
│   ├── config.js       ← Default content + API keys
│   ├── firebase-config.js  ← Firebase connection credentials
│   ├── firebase-loader.js  ← Loads data from Firebase
│   ├── main.js         ← Main website code (nav, footer, rendering)
│   ├── admin.js        ← Admin panel code
│   ├── calendar.js     ← Booking form → Google Calendar
│   ├── contact.js      ← Contact form → EmailJS
│   └── blog.js         ← Blog page rendering and filtering
└── images/             ← All photos and logos
```

### JavaScript files explained in plain English:
| File | What It Does |
|---|---|
| `config.js` | Contains all default website content as a backup. Also stores API keys. If Firebase is down, the site uses this. |
| `firebase-config.js` | The "password" to connect to the Firebase database. |
| `firebase-loader.js` | Grabs the latest content from Firebase when someone visits the site. Falls back to config.js if Firebase doesn't respond. |
| `main.js` | Builds the navigation bar, footer, testimonials, blog previews, mobile menu, and scroll animations on every page. |
| `admin.js` | Everything in the admin panel — login, editing, saving, uploading images, managing patients and notes. |
| `calendar.js` | Sends booking form data to Google Apps Script to create calendar events. |
| `contact.js` | Sends contact form messages via EmailJS (or falls back to opening the visitor's email app). |
| `blog.js` | Displays blog posts, handles category filtering, and shows full articles. |

---

## 13. IMAGES ON THE WEBSITE

All images are in the `images/` folder:

| Image File | What It Is | Where It Shows Up |
|---|---|---|
| `logo-full.png` | Main logo with tagline | Nav bar and footer on every page |
| `logo-no-tagline.png` | Logo without tagline | Backup — not currently used |
| `logo-text-only.png` | Text-only logo | Backup — not currently used |
| `logo-icon.png` | Lotus icon only | Backup — not currently used |
| `bianca-dunn.png` | Bianca's headshot | Homepage and About page |
| `children-playing.png` | Kids running outdoors | Homepage "Who We Help" section |
| `parents-kids.png` | Parents and kids with toys | Services page "What Parents Can Expect" |
| `aota.png` | AOTA credential badge | Footer on every page |
| `dc-health.png` | DC Health badge | Footer on every page |
| `florida-health.png` | Florida Health badge | Footer on every page |
| `texas-hhs.png` | Texas HHS badge | Footer on every page |
| `testimonial-video.mp4` | Video testimonial #1 | Homepage testimonials |
| `testimonial-video-2.mp4` | Video testimonial #2 | Homepage testimonials |

### To replace an image:
Name the new file **exactly the same** as the old one, put it in the `images/` folder (replacing the old file), and deploy (Section 16).

---

## 14. ACCOUNTS AND LOGINS YOU NEED

| Service | What It's For | URL |
|---|---|---|
| **Admin Panel** | Edit website content | https://dunnwelltherapy.com/admin.html |
| **GitHub** | Code backup | https://github.com/dunnwelltherapy/dunnwelltherapy |
| **Firebase** | Database + auth + storage | https://console.firebase.google.com |
| **Google Cloud Console** | Calendar API keys | https://console.cloud.google.com |
| **Google Apps Script** | Booking automation | https://script.google.com |
| **EmailJS** | Contact form emails | https://www.emailjs.com |
| **Domain Registrar** | dunnwelltherapy.com domain | Wherever the domain was purchased |

**There is NO Vercel account.** Deployments happen via Terminal command (Section 16).

### How to create a new admin user:
1. Go to https://console.firebase.google.com → Sign in → Click **dunnwelltherapy**
2. Click **Authentication** in the left sidebar → Click the **Users** tab
3. Click **Add User** → Enter email and password → Click **Add User**
4. That person can now log in at admin.html

---

## 15. HOW TO MAKE COMMON CHANGES (STEP-BY-STEP)

All of these are done through the admin panel (https://dunnwelltherapy.com/admin.html). Log in first.

### Change the phone number:
Settings → Update **Phone** field → Click **Save Settings**

### Change the email:
Settings → Update **Primary Email** and **Secondary Email** → Click **Save Settings**

### Add a blog post:
Blog Posts → Click **New Post** → Fill in title, category, date, author, excerpt, content → Click **Save**

### Edit a blog post:
Blog Posts → Click the post → Make changes → Click **Save**

### Delete a blog post:
Blog Posts → Click the trash icon next to the post → Confirm

### Add a testimonial:
Testimonials → Click **Add Testimonial** → Type quote, name, role → Click **Save**

### Add a video testimonial:
Testimonials → Scroll to Video Testimonials → Paste URL or upload file → Click **Add**

### Change office hours:
Settings → Scroll to **Office Hours** → Edit any day → Click **Save Settings**

### Update Bianca's bio or photo:
About / Bio → Edit text fields or upload a new photo → Click **Save**

### Change social media links:
Settings → Scroll to **Social Media** → Update Facebook/Instagram/LinkedIn URLs → Click **Save Settings**

---

## 16. HOW TO DEPLOY — PUSHING CODE CHANGES TO THE LIVE WEBSITE

### When you need this:
Only when someone edited the actual files (HTML, CSS, JS, or images). Admin panel changes do NOT need deployment.

### Prerequisites:
Make sure **Git** and **Node.js** are installed (see Section 5 for how to check).

### Step-by-step:

Open Terminal (Cmd + Space → "Terminal" → Enter). Make sure the external drive is plugged in.

**Step 1 — Go to the website folder:**
```
cd "/Volumes/Willie Extr/Bianca Dunn/website"
```
*Tells Terminal where the files are.*

**Step 2 — See what changed:**
```
git status
```
*Shows which files were modified. Red = changed. "Nothing to commit" = nothing to deploy.*

**Step 3 — Stage the changes:**
```
git add .
```
*Prepares all changed files. The `.` means "everything." No output = it worked.*

**Step 4 — Save with a description:**
```
git commit -m "Describe what you changed"
```
*Creates a save point. Replace the text in quotes with your description, like:*
- `git commit -m "Updated phone number"`
- `git commit -m "Added new team photo"`

**Step 5 — Upload to GitHub:**
```
git push origin main
```
*Backs up your changes online. You should see progress text ending in `main -> main`.*

**Step 6 — Make it live:**
```
npx vercel --prod --yes
```
*Uploads to the live website. When you see `Aliased: https://dunnwelltherapy.com` — it's done!*

### Common errors:
- **"fatal: not a git repository"** → Run the `cd` command from Step 1 first. Make sure the drive is plugged in.
- **"error: failed to push"** → Run `git pull origin main` first, then try `git push origin main` again.
- **"npx: command not found"** → Install Node.js from https://nodejs.org, then reopen Terminal.
- **"Vercel CLI" errors** → Run `npm install -g vercel` first, then try again.

---

## 17. HOW TO EDIT CODE FILES (FOR ADVANCED CHANGES)

Most changes should be done through the admin panel. But for layout/design changes, you'll need to edit code files.

### Steps:
1. Find the file in Finder (Willie Extr → Bianca Dunn → website)
2. Right-click → Open With → Visual Studio Code
3. Make changes carefully
4. Save: **Cmd + S**
5. Preview locally (Section 5) to check your work
6. Deploy (Section 16) to make it live

### Tips:
- **Back up first** — Copy the file to your desktop before editing
- **Undo mistakes** — Press **Cmd + Z** repeatedly in VS Code
- **If you break something badly** — In Terminal, type: `git checkout -- filename.html` (replace with the actual file name) to restore the last saved version from GitHub

---

## 18. CLINICAL NOTES FEATURE (PRIVATE — ADMIN ONLY)

A private section in the admin panel for documenting patient therapy sessions. **Not visible to website visitors.**

### Adding a patient:
Admin panel → Clinical Notes → **New Patient** → Fill in name, DOB, guardian, phone, email, diagnosis, status → **Save**

### Writing session notes:
1. Click a patient in the left sidebar
2. Click **New Note**
3. Choose type:
   - **SOAP** — 4 fields: **S**ubjective (what patient/parent says), **O**bjective (what you observed), **A**ssessment (clinical reasoning), **P**lan (next steps)
   - **Narrative** — One open text box
   - **Progress** — One open text box for progress updates
4. Fill in session date, duration, and content
5. Notes **auto-save every 2 seconds** — you'll see "Saving..." then "Saved"

### Other features:
- **Search** patients by name
- **Filter** by Active / Discharged / All
- **Email** a note (opens your email app with the note pre-filled)
- **Mark as Final** (locks the note)
- **Delete** notes

---

## 19. TROUBLESHOOTING — WHAT TO DO WHEN SOMETHING GOES WRONG

### "Website looks the same after admin panel changes"
Press **Cmd + Shift + R** (hard refresh). Or try an incognito window (Safari: File → New Private Window).

### "Can't log into admin panel"
Check email/password. Go to Firebase Console → Authentication → Users to verify the account exists.

### "Booking form says 'Something went wrong'"
Go to script.google.com → DunnWell Booking → Deploy → Manage deployments. Make sure it's active with "Anyone" access. Redeploy with a New Version if needed.

### "Not getting booking notification emails"
Check the Apps Script code has `care@dunnwelltherapy.com`. Redeploy if you changed it.

### "Images not showing"
Check the file is in the `images/` folder, the name matches exactly (capitalization matters), and it's a PNG/JPG/WebP file.

### "Contact form not sending"
EmailJS may not be set up. Check `js/config.js` for placeholder values. See Section 9 for setup.

### "Accidentally broke the code"
- **Undo:** In VS Code, press Cmd + Z repeatedly
- **Restore from GitHub:** In Terminal: `cd "/Volumes/Willie Extr/Bianca Dunn/website"` then `git checkout -- filename.html`
- **Restore everything:** `git checkout .` (undoes ALL uncommitted changes)

### "External drive not showing up"
Unplug and replug it. Try a different USB port. Check Finder sidebar under "Locations."

### "Terminal says 'permission denied'"
Add `sudo` before the command (e.g., `sudo npm install -g vercel`). Type your Mac password when asked (it won't show as you type — that's normal).

---

## 20. ALL CREDENTIALS AND KEYS IN ONE PLACE

### Firebase
| Item | Value |
|---|---|
| Project ID | `dunnwelltherapy` |
| API Key | `AIzaSyBI-DVKipZJ38ZHiFRG3LvD0U4kAAcPa-g` |
| Auth Domain | `dunnwelltherapy.firebaseapp.com` |
| Storage Bucket | `dunnwelltherapy.firebasestorage.app` |

### Google Calendar
| Item | Value |
|---|---|
| API Key | `AIzaSyBR05wTUI6F6Pn8KFS4_girzlztDQk08fA` |
| Client ID | `1090467909421-u5aklg5d82vvs966ck0c353ntesfek3f.apps.googleusercontent.com` |

### Google Apps Script
| Item | Value |
|---|---|
| URL | `https://script.google.com/macros/s/AKfycbwQUJmmufNyo6wE4_eh5d61P0ySslX4dAhQdR6psu8Sqw_WRSp7Wujl0GtjibeL1A9Snw/exec` |

### GitHub
| Item | Value |
|---|---|
| Repository | `https://github.com/dunnwelltherapy/dunnwelltherapy` |
| Branch | `main` |

### Contact Info on Website
| Item | Value |
|---|---|
| Email | `care@dunnwelltherapy.com` |
| Phone | `(786) 479-3593` |
| Address | Arlington / Alexandria, Virginia |

### Design Colors
| Color | Code | Used For |
|---|---|---|
| Dark Plum | `#4A1A3A` | Dark sections, hero backgrounds |
| Plum | `#6B2D5B` | Main brand color, buttons, headings |
| Light Plum | `#9B5F8B` | Accents, icons, lighter elements |
| Mauve | `#C9A0C9` | Borders, subtle highlights |
| Lavender | `#F3E8F3` | Light backgrounds, cards |
| Warm Background | `#FDF8FC` | Page backgrounds (almost white with a purple tint) |

### Fonts
| Usage | Font | Style |
|---|---|---|
| Headings | Playfair Display | Elegant font with serifs (little feet on letters) |
| Body text | Inter | Clean, modern font without serifs |
| Icons | Font Awesome 6.5.1 | Library of small icons (calendar, phone, arrows, etc.) |

---

*Last updated: March 4, 2026*
*Created by Willie Austin with Claude Code*
