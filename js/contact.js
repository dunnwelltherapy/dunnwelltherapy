/* ============================================================
   DUNNWELL THERAPY - Contact Form Handler
   Sends contact form submissions to TWO email addresses
   using EmailJS. Falls back to mailto: if not configured.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', handleContactSubmit);
});

function handleContactSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const btn = document.getElementById('contact-submit-btn');
  const data = new FormData(form);
  const C = SITE_CONFIG;

  // Disable button while sending
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  // Check if EmailJS is configured
  if (C.emailjs.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
    // Fallback: open mailto with both addresses
    const subject = encodeURIComponent(`New Inquiry from ${data.get('firstName')} ${data.get('lastName')}`);
    const body = encodeURIComponent(
      `Contact Form Submission\n\n` +
      `Name: ${data.get('firstName')} ${data.get('lastName')}\n` +
      `Email: ${data.get('email')}\n` +
      `Phone: ${data.get('phone') || 'Not provided'}\n` +
      `Child / Client Age: ${data.get('clientAge') || 'Not provided'}\n` +
      `Service of Interest: ${data.get('serviceInterest') || 'Not specified'}\n` +
      `Location: ${data.get('city') || ''}, ${data.get('state') || 'Not specified'}\n\n` +
      `Message / Goals:\n${data.get('message')}\n`
    );

    window.location.href = `mailto:${C.emailPrimary}?cc=${C.emailSecondary}&subject=${subject}&body=${body}`;

    // Re-enable button
    btn.disabled = false;
    btn.innerHTML = originalHTML;

    window.showAlert('contact-success');
    form.reset();
    return;
  }

  // EmailJS is configured — send to both addresses
  if (typeof emailjs === 'undefined') {
    console.error('EmailJS SDK not loaded');
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    window.showAlert('contact-error');
    return;
  }

  emailjs.init(C.emailjs.publicKey);

  const templateParams = {
    to_email_1: C.emailPrimary,
    to_email_2: C.emailSecondary,
    from_name: `${data.get('firstName')} ${data.get('lastName')}`,
    from_email: data.get('email'),
    phone: data.get('phone') || 'Not provided',
    client_age: data.get('clientAge') || 'Not provided',
    service_interest: data.get('serviceInterest') || 'Not specified',
    state: data.get('state') || 'Not specified',
    city: data.get('city') || 'Not provided',
    message: data.get('message'),
  };

  emailjs.send(C.emailjs.serviceId, C.emailjs.contactTemplateId, templateParams)
    .then(() => {
      window.showAlert('contact-success');
      form.reset();
    })
    .catch(err => {
      console.error('EmailJS error:', err);
      document.getElementById('contact-error-msg').textContent =
        'Failed to send message. Please try again or call us at ' + C.phone;
      window.showAlert('contact-error');
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    });
}
