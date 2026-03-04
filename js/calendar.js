/* ============================================================
   DUNNWELL THERAPY - Google Calendar Integration
   Posts booking data to a Google Apps Script web app which
   creates the event on the business calendar and sends
   a confirmation email. No client-side sign-in required.
   ============================================================ */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQUJmmufNyo6wE4_eh5d61P0ySslX4dAhQdR6psu8Sqw_WRSp7Wujl0GtjibeL1A9Snw/exec';

document.addEventListener('DOMContentLoaded', () => {
  const bookingForm = document.getElementById('gcal-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleGCalBooking);
  }
});

async function handleGCalBooking(e) {
  e.preventDefault();

  const firstName = document.getElementById('gcal-first-name').value.trim();
  const lastName = document.getElementById('gcal-last-name').value.trim();
  const name = firstName + ' ' + lastName;
  const email = document.getElementById('gcal-email').value.trim();
  const phone = document.getElementById('gcal-phone') ? document.getElementById('gcal-phone').value.trim() : '';
  const age = document.getElementById('gcal-age') ? document.getElementById('gcal-age').value.trim() : '';
  const state = document.getElementById('gcal-state') ? document.getElementById('gcal-state').value : '';
  const date = document.getElementById('gcal-date').value;
  const time = document.getElementById('gcal-time').value;
  const service = document.getElementById('gcal-service').value;
  const notes = document.getElementById('gcal-notes').value.trim();

  if (!firstName || !lastName || !email || !date || !time) {
    window.showAlert('booking-error');
    return;
  }

  // Disable submit button and show loading
  const submitBtn = document.getElementById('gcal-submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';

  const payload = JSON.stringify({
    name,
    email,
    phone,
    age,
    state,
    date,
    time,
    service,
    notes,
    duration: 60
  });

  try {
    // Send as text/plain to avoid CORS preflight issues with Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
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
      // If we can't parse JSON, check if response was ok
      success = response.ok || response.type === 'opaque';
    }

    if (success !== false) {
      window.showAlert('booking-success');
      e.target.reset();
    } else {
      window.showAlert('booking-error');
    }
  } catch (err) {
    console.error('Booking error:', err);
    // Fallback: try no-cors mode
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: payload
      });
      window.showAlert('booking-success');
      e.target.reset();
    } catch (err2) {
      console.error('Fallback booking error:', err2);
      window.showAlert('booking-error');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}
