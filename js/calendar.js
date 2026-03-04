/* ============================================================
   DUNNWELL THERAPY - Google Calendar Integration
   Posts booking data to a Google Apps Script web app which
   creates the event on the business calendar and sends
   a confirmation email. No client-side sign-in required.
   ============================================================ */

const APPS_SCRIPT_URL = 'https://script.google.com/a/macros/dunnwelltherapy.com/s/AKfycbwQUJmmufNyo6wE4_eh5d61P0ySslX4dAhQdR6psu8Sqw_WRSp7Wujl0GtjibeL1A9Snw/exec';

document.addEventListener('DOMContentLoaded', () => {
  const bookingForm = document.getElementById('gcal-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleGCalBooking);
  }
});

async function handleGCalBooking(e) {
  e.preventDefault();

  const name = document.getElementById('gcal-name').value.trim();
  const email = document.getElementById('gcal-email').value.trim();
  const phone = document.getElementById('gcal-phone') ? document.getElementById('gcal-phone').value.trim() : '';
  const date = document.getElementById('gcal-date').value;
  const time = document.getElementById('gcal-time').value;
  const service = document.getElementById('gcal-service').value;
  const notes = document.getElementById('gcal-notes').value.trim();

  if (!name || !email || !date || !time) {
    window.showAlert('booking-error');
    return;
  }

  // Disable submit button and show loading
  const submitBtn = document.getElementById('gcal-submit-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        date,
        time,
        service,
        notes,
        duration: 60
      })
    });

    // With no-cors mode we can't read the response, but if fetch didn't throw it was sent
    window.showAlert('booking-success');
    e.target.reset();
  } catch (err) {
    console.error('Booking error:', err);
    window.showAlert('booking-error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}
