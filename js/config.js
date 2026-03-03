/*
 * ============================================================
 *  DUNNWELL THERAPY - SITE CONFIGURATION (FALLBACK)
 * ============================================================
 *  This file serves as the fallback data source. When Firebase
 *  is configured, content is loaded from Firestore instead.
 *  If Firebase is unreachable, the site uses these values.
 *
 *  To manage content visually, log in at /admin.html
 * ============================================================
 */

const SITE_CONFIG = {

  /* ----------------------------------------------------------
   *  GENERAL
   * ---------------------------------------------------------- */
  siteName: "DunnWell Therapy, LLC",
  tagline: "Therapy, Dunn Well.",
  subtitle: "Supporting Regulation, Independence & Everyday Success",
  heroTagline: "Personalized Occupational Therapy for Children, Teens & Families",
  heroDelivery: "In-home \u2022 Virtual \u2022 School & IEP Consulting",
  phone: "(555) 123-4567",
  fax: "(555) 123-4568",
  address: "Arlington / Alexandria, Virginia",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d99370.14887809972!2d-77.17089655!3d38.87969835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b7b69c3ba26889%3A0x89dba82bfe5765b3!2sArlington%2C%20VA!5e0!3m2!1sen!2sus!4v1709500000000!5m2!1sen!2sus",

  /* ----------------------------------------------------------
   *  EMAIL ADDRESSES (contact form sends to BOTH)
   * ---------------------------------------------------------- */
  emailPrimary: "contact@dunnwelltherapy.com",
  emailSecondary: "bookings@dunnwelltherapy.com",

  /* ----------------------------------------------------------
   *  EMAILJS CONFIGURATION
   *  Sign up at https://www.emailjs.com (free: 200 emails/mo)
   * ---------------------------------------------------------- */
  emailjs: {
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    contactTemplateId: "YOUR_CONTACT_TEMPLATE_ID",
    bookingTemplateId: "YOUR_BOOKING_TEMPLATE_ID",
  },

  /* ----------------------------------------------------------
   *  SIMPLE PRACTICE
   * ---------------------------------------------------------- */
  simplePractice: {
    bookingUrl: "https://yourpractice.clientsecure.me",
    widgetUrl: "https://widget.simplepractice.com/widget/process/YOUR_WIDGET_ID",
  },

  /* ----------------------------------------------------------
   *  GOOGLE CALENDAR (fallback booking)
   * ---------------------------------------------------------- */
  googleCalendar: {
    clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    apiKey: "YOUR_GOOGLE_API_KEY",
    calendarId: "primary",
    scopes: "https://www.googleapis.com/auth/calendar.events",
  },

  /* ----------------------------------------------------------
   *  SOCIAL MEDIA LINKS
   * ---------------------------------------------------------- */
  social: {
    facebook: "https://facebook.com/dunnwelltherapy",
    instagram: "https://instagram.com/dunnwelltherapy",
    linkedin: "https://linkedin.com/company/dunnwelltherapy",
  },

  /* ----------------------------------------------------------
   *  OFFICE HOURS
   * ---------------------------------------------------------- */
  hours: [
    { day: "Monday",    time: "9:00 AM - 5:00 PM" },
    { day: "Tuesday",   time: "9:00 AM - 5:00 PM" },
    { day: "Wednesday", time: "9:00 AM - 5:00 PM" },
    { day: "Thursday",  time: "9:00 AM - 5:00 PM" },
    { day: "Friday",    time: "9:00 AM - 3:00 PM" },
    { day: "Saturday",  time: "By Appointment" },
    { day: "Sunday",    time: "Closed" },
  ],

  /* ----------------------------------------------------------
   *  SERVICE LOCATIONS
   * ---------------------------------------------------------- */
  serviceLocations: [
    {
      type: "Virtual Services",
      icon: "fa-laptop-medical",
      description: "DunnWell Therapy offers virtual occupational therapy and executive function coaching for clients located in Washington, DC, Virginia, Florida, and Texas.",
    },
    {
      type: "In-Center Services",
      icon: "fa-building",
      description: "In-person services are available at our Arlington / Alexandria, Virginia location.",
    },
    {
      type: "In-Home Services",
      icon: "fa-house-chimney-medical",
      description: "Home-based occupational therapy services are available throughout Virginia and Washington, DC, providing support within real daily routines and home environments.",
    },
  ],

  /* ----------------------------------------------------------
   *  SERVICE INTEREST OPTIONS (for contact/booking forms)
   * ---------------------------------------------------------- */
  serviceInterests: [
    "In-Home Occupational Therapy",
    "In-Center Occupational Therapy",
    "Virtual OT & Executive Function Coaching",
    "Parent Coaching & Consultation",
    "IEP & School Consultation",
    "Not Sure, I'd Like to Discuss",
  ],

  /* ----------------------------------------------------------
   *  SERVICES
   * ---------------------------------------------------------- */
  services: [
    {
      id: "in-home",
      icon: "fa-house-chimney-medical",
      title: "In-Home & In-Office Occupational Therapy",
      short: "Therapy delivered where your child is most comfortable, whether at home or in our center.",
      description: "Therapy delivered where your child is most comfortable, whether at home or in our center, supporting daily routines, play, self-care, regulation, and functional skill development in real time.",
      features: ["Daily Routine Support", "Play-Based Therapy", "Self-Care Skill Development", "Sensory Regulation Strategies", "Fine Motor & Handwriting", "Functional Skill Building"],
    },
    {
      id: "virtual",
      icon: "fa-laptop-medical",
      title: "Virtual OT & Executive Function Coaching",
      short: "Ideal for older children, teens, and young adults working on organization and independence.",
      description: "Ideal for older children, teens, and young adults working on organization, planning, task initiation, emotional regulation, social participation, leisure skills, and increasing independence.",
      features: ["Organization & Planning", "Task Initiation Support", "Emotional Regulation", "Social Participation", "Leisure Skill Development", "Independence Building"],
    },
    {
      id: "parent-coaching",
      icon: "fa-people-arrows",
      title: "Parent Coaching & Consultation",
      short: "Practical, realistic strategies that can be implemented immediately at home.",
      description: "We partner with parents and caregivers to navigate behavior, regulation, routines, and school challenges using practical, realistic strategies that can be implemented immediately at home.",
      features: ["Behavior Navigation", "Regulation Strategies", "Routine Building", "School Challenge Support", "Immediate Home Strategies", "Collaborative Planning"],
    },
    {
      id: "iep",
      icon: "fa-school",
      title: "IEP & School Consultation",
      short: "Navigate evaluations, goals, accommodations, and school collaboration with confidence.",
      description: "Support navigating evaluations, goals, accommodations, and school collaboration with a consultative approach that complements, rather than duplicates, school-based services.",
      features: ["Evaluation Navigation", "Goal Development", "Accommodation Guidance", "School Team Collaboration", "IEP Meeting Support", "Advocacy & Education"],
    },
  ],

  /* ----------------------------------------------------------
   *  WHAT MAKES DUNNWELL DIFFERENT
   * ---------------------------------------------------------- */
  differentiators: [
    "Therapy delivered in real environments (home, center, school-based collaboration, and virtual)",
    "Coaching and carryover strategies built into every plan",
    "Strength-based, relationship-driven care for children, teens, and adults",
    "Clear communication and realistic, functional goals",
    "Flexible, concierge-style services that adapt to real schedules",
  ],

  /* ----------------------------------------------------------
   *  WHO WE HELP
   * ---------------------------------------------------------- */
  whoWeHelp: [
    "Sensory regulation and emotional control",
    "Fine motor skills and handwriting",
    "Attention, transitions, and routines",
    "Executive functioning and organization",
    "Self-care and daily living skills",
    "School participation and IEP needs",
  ],

  /* ----------------------------------------------------------
   *  OUR APPROACH
   * ---------------------------------------------------------- */
  approach: [
    "Sensory integration and regulation strategies",
    "Developmental and functional skill building",
    "Executive functioning frameworks",
    "Strength-based and trauma-informed care",
  ],

  /* ----------------------------------------------------------
   *  WHAT PARENTS CAN EXPECT
   * ---------------------------------------------------------- */
  parentExpect: [
    "Clear communication and collaborative planning",
    "Honest feedback and realistic expectations",
    "Tools and strategies you can use between sessions",
    "Respect for your child's personality and pace",
    "Support that feels calm, empowering, and intentional",
  ],

  /* ----------------------------------------------------------
   *  BLOG / FORUM POSTS
   *  Add new posts at the TOP (newest first).
   * ---------------------------------------------------------- */
  blogPosts: [
    {
      id: "sensory-tips-home",
      title: "5 Sensory-Friendly Tips for Your Home Environment",
      date: "2026-03-01",
      author: "Bianca Dunn, MSOT, OTR/L",
      category: "Sensory Processing",
      image: "",
      excerpt: "Creating a sensory-friendly home doesn't require a complete overhaul. Small, intentional changes can make a huge difference for children and adults with sensory processing challenges.",
      content: `
        <p>Creating a sensory-friendly home doesn't require a complete overhaul. Small, intentional changes can make a huge difference for children and adults with sensory processing challenges. Here are five practical tips you can start implementing today:</p>
        <h3>1. Designate a Calm-Down Space</h3>
        <p>Create a quiet corner with soft lighting, comfortable seating (like a bean bag or rocking chair), and calming items such as weighted blankets, noise-canceling headphones, or fidget tools. This gives everyone in the family a place to reset when feeling overwhelmed.</p>
        <h3>2. Manage Lighting</h3>
        <p>Harsh fluorescent lighting can be overstimulating. Switch to warm-toned LED bulbs and use dimmer switches where possible. Natural light is ideal, so keep curtains open during the day and use blackout curtains for sleep.</p>
        <h3>3. Reduce Background Noise</h3>
        <p>Constant background noise from TVs, appliances, and traffic can contribute to sensory overload. Use rugs, curtains, and soft furnishings to absorb sound. White noise machines can also help create a consistent auditory environment.</p>
        <h3>4. Organize with Purpose</h3>
        <p>Visual clutter is a form of sensory input. Use labeled bins, closed storage, and consistent organization systems. Clear surfaces help reduce visual overwhelm and make spaces feel calmer.</p>
        <h3>5. Incorporate Movement Opportunities</h3>
        <p>Sensory seekers benefit from built-in movement options. A small trampoline, therapy ball chair, or a swing in the backyard can provide the proprioceptive and vestibular input that helps with regulation.</p>
        <p><strong>Remember:</strong> Every individual's sensory needs are unique. What works for one person may not work for another. An occupational therapist can help you create a personalized sensory plan for your home.</p>
      `,
    },
    {
      id: "what-is-ot",
      title: "What Is Occupational Therapy? A Complete Guide",
      date: "2026-02-15",
      author: "Bianca Dunn, MSOT, OTR/L",
      category: "Education",
      image: "",
      excerpt: "Occupational therapy is one of the most versatile healthcare professions, yet many people aren't sure what it involves. Let's break down what OT is and how it can help.",
      content: `
        <p>Occupational therapy (OT) is a client-centered health profession focused on helping people of all ages participate in the things they want and need to do, their "occupations." These aren't just jobs; they include everything from getting dressed and eating to playing, learning, and working.</p>
        <h3>Who Can Benefit from OT?</h3>
        <ul>
          <li><strong>Children</strong> who struggle with fine motor skills, sensory processing, handwriting, or self-care</li>
          <li><strong>Teens</strong> working on executive functioning, organization, and independence</li>
          <li><strong>Adults</strong> dealing with chronic conditions, mental health challenges, or life transitions</li>
          <li><strong>Families</strong> looking for guidance and strategies to support their child's development</li>
        </ul>
        <h3>What Does an OT Session Look Like?</h3>
        <p>Every session is tailored to the individual. It might include therapeutic activities, sensory integration techniques, executive functioning coaching, parent education, or school consultation. The goal is always to help you do what matters most, with confidence.</p>
        <h3>How Is OT Different from Physical Therapy?</h3>
        <p>While physical therapy focuses on mobility and movement, occupational therapy focuses on functional independence, meaning the ability to perform everyday tasks. OTs look at the whole picture: physical, cognitive, emotional, and environmental factors.</p>
        <p>If you or someone you know could benefit from occupational therapy, <a href="contact.html">reach out to us</a> for a free consultation.</p>
      `,
    },
    {
      id: "executive-functioning",
      title: "Executive Functioning: What It Is and How OT Helps",
      date: "2026-02-01",
      author: "Bianca Dunn, MSOT, OTR/L",
      category: "Executive Functioning",
      image: "",
      excerpt: "Executive functioning skills are the mental processes that help us plan, focus, remember instructions, and juggle multiple tasks. Here's how OT can help strengthen them.",
      content: `
        <p>Executive functioning skills are the mental processes that help us plan, focus, remember instructions, and juggle multiple tasks. They're essential for success in school, work, and daily life.</p>
        <h3>Common Signs of Executive Functioning Challenges</h3>
        <ul>
          <li>Difficulty starting or completing tasks</li>
          <li>Trouble with organization and time management</li>
          <li>Forgetfulness and losing things frequently</li>
          <li>Difficulty with emotional regulation</li>
          <li>Struggles with flexible thinking and problem-solving</li>
        </ul>
        <h3>How OT Supports Executive Functioning</h3>
        <p>Occupational therapists work with children, teens, and young adults to build these skills through practical, real-world strategies:</p>
        <ul>
          <li><strong>Visual schedules and planning tools</strong> to support task initiation and completion</li>
          <li><strong>Environmental modifications</strong> to reduce overwhelm and support focus</li>
          <li><strong>Coaching strategies</strong> for time management and prioritization</li>
          <li><strong>Self-regulation techniques</strong> to manage frustration and emotional responses</li>
        </ul>
        <p>At DunnWell Therapy, our virtual OT and executive function coaching sessions are specifically designed for older children, teens, and young adults working on these essential life skills. <a href="book.html">Schedule a consultation</a> to learn more.</p>
      `,
    },
  ],

  /* ----------------------------------------------------------
   *  TESTIMONIALS
   * ---------------------------------------------------------- */
  testimonials: [
    {
      text: "DunnWell Therapy transformed our daily routines. Bianca's calm, practical approach gave us real strategies we could use immediately. Our son is more confident and regulated than ever.",
      author: "Sarah M.",
      role: "Parent",
    },
    {
      text: "The executive functioning coaching has been a game-changer for our teenager. She's more organized, independent, and actually enjoys her sessions. We couldn't recommend DunnWell more highly.",
      author: "James T.",
      role: "Parent",
    },
    {
      text: "Bianca took the time to truly understand our family. The parent coaching gave me clarity and confidence I didn't have before. Therapy that meets you where you are, that's DunnWell.",
      author: "Maria L.",
      role: "Parent",
    },
  ],

  /* ----------------------------------------------------------
   *  ABOUT / BIO
   * ---------------------------------------------------------- */
  about: {
    name: "Bianca Dunn",
    credentials: "MSOT, OTR/L",
    photo: "images/bianca-dunn.png",
    title: "Founder & Licensed Occupational Therapist",
    bio: `DunnWell Therapy was founded by Bianca Dunn, MSOT, OTR/L, a licensed occupational therapist with over eight years of experience delivering comprehensive, client-centered care across medical, educational, and community-based settings. Bianca earned both her undergraduate and graduate degrees in Occupational Therapy from the prestigious Florida Agricultural and Mechanical University (Florida A&M University), where she built a strong foundation in culturally responsive care, health equity, and community-centered practice.`,
    bioExtended: `Bianca has worked extensively within hospital systems, providing both inpatient and outpatient occupational therapy services, as well as across school-based programs, early intervention, and in-home therapy models. Her diverse clinical background gives her the unique ability to bridge medical expertise with functional, real-world application, meeting clients and families exactly where they are and tailoring every intervention to their daily environments and lived experiences.

Throughout her career, Bianca has supported children, adolescents, and families with a wide range of developmental, sensory, emotional, and functional needs. She is known for her calm, grounded presence, her clear and compassionate communication style, and her ability to build trusting, collaborative relationships with clients, caregivers, and interdisciplinary teams. Bianca approaches each family with cultural humility and intention, recognizing how identity, family values, environment, and systemic barriers impact participation, regulation, and access to care.`,
    specialties: `Bianca's clinical specialties include sensory integration, play-based and developmentally appropriate therapy, executive functioning support, developmental group programming, and family-centered intervention. She is also highly regarded for her advocacy skills, guiding families through complex systems such as healthcare, education, and special education services with clarity, transparency, and confidence. Her work emphasizes functional progress, emotional regulation, and the creation of sustainable routines and supports that extend well beyond the therapy session into everyday life.`,
    founding: `Drawing from her breadth of experience and deep commitment to culturally appropriate, relationship-driven care, Bianca founded DunnWell Therapy to offer a more flexible, holistic model of occupational therapy. It is a practice that honors each client's strengths, respects family dynamics and cultural context, and prioritizes meaningful, long-term outcomes over one-size-fits-all intervention.`,
    mission: `At DunnWell Therapy, our mission is to provide relationship-centered, individualized occupational therapy that supports meaningful participation in everyday life across the lifespan. We partner with children, teens, adults, and families to build regulation, executive functioning, functional skills, and confidence through therapy that is practical, strength-based, and rooted in real environments. Through advocacy, collaboration, and intentional care, we empower individuals and families with the tools to foster independence, connection, and lasting growth.`,
    paymentNote: `DunnWell Therapy is a private-pay practice at this time. This model allows us to tailor services to your child's unique needs, offer flexible scheduling, and provide parent coaching and collaboration without restrictions. We're always happy to discuss fees and help families understand options for reimbursement if available through their insurance plan.`,
    education: [
      "Master of Science in Occupational Therapy (MSOT), Florida A&M University",
      "Bachelor of Science in Occupational Therapy, Florida A&M University",
    ],
    certifications: [
      "Licensed & Registered Occupational Therapist (OTR/L)",
      "Sensory Integration Trained",
      "CPR/First Aid Certified",
    ],
  },
};
