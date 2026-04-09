/* ============================================================
   DUNNWELL THERAPY - Contact Form Handler
   Routes through Google Apps Script for reliable delivery.
   Sends email to care@dunnwelltherapy.com + SMS notification.
   ============================================================ */

const CONTACT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQUJmmufNyo6wE4_eh5d61P0ySslX4dAhQdR6psu8Sqw_WRSp7Wujl0GtjibeL1A9Snw/exec';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', handleContactSubmit);
});

async function handleContactSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const btn = document.getElementById('contact-submit-btn');
  const data = new FormData(form);

  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  const payload = JSON.stringify({
    type: 'contact',
    name: (data.get('firstName') || '') + ' ' + (data.get('lastName') || ''),
    email: data.get('email') || '',
    phone: data.get('phone') || 'Not provided',
    age: data.get('clientAge') || 'Not provided',
    state: data.get('state') || 'Not specified',
    service: data.get('serviceInterest') || 'Not specified',
    notes: data.get('message') || '',
    date: 'N/A',
    time: 'N/A',
    duration: 0
  });

  try {
    const response = await fetch(CONTACT_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: payload,
      redirect: 'follow'
    });

    let success = false;
    try {
      const result = await response.json();
      success = result.success;
    } catch (_) {
      success = response.ok || response.type === 'opaque';
    }

    if (success !== false) {
      window.showAlert('contact-success');
      form.reset();
    } else {
      window.showAlert('contact-error');
    }
  } catch (err) {
    console.error('Contact form error:', err);
    try {
      await fetch(CONTACT_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: payload
      });
      window.showAlert('contact-success');
      form.reset();
    } catch (err2) {
      console.error('Fallback error:', err2);
      window.showAlert('contact-error');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}
