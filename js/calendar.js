/* ============================================================
   DUNNWELL THERAPY - Google Calendar Integration
   Provides OAuth2 login and calendar event creation as a
   fallback booking method when Simple Practice is unavailable.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initGoogleCalendar();
});

let tokenClient;
let gapiInited = false;
let gisInited = false;

function initGoogleCalendar() {
  const loginBtn = document.getElementById('gcal-login-btn');
  const logoutBtn = document.getElementById('gcal-logout-btn');
  const bookingForm = document.getElementById('gcal-booking-form');

  if (!loginBtn) return;

  // Load Google APIs dynamically
  loadGapiScript();
  loadGisScript();

  loginBtn.addEventListener('click', handleGCalLogin);

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleGCalLogout);
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', handleGCalBooking);
  }
}

/* ----------------------------------------------------------
 *  Load Google API scripts
 * ---------------------------------------------------------- */
function loadGapiScript() {
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    gapi.load('client', async () => {
      const C = SITE_CONFIG.googleCalendar;

      if (C.apiKey === 'YOUR_GOOGLE_API_KEY') {
        console.info('Google Calendar API key not configured. Using form-only mode.');
        return;
      }

      try {
        await gapi.client.init({
          apiKey: C.apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        gapiInited = true;
        maybeEnableButtons();
      } catch (err) {
        console.error('GAPI init error:', err);
      }
    });
  };
  document.head.appendChild(script);
}

function loadGisScript() {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => {
    const C = SITE_CONFIG.googleCalendar;

    if (C.clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      console.info('Google Calendar Client ID not configured. Using form-only mode.');
      return;
    }

    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: C.clientId,
        scope: C.scopes,
        callback: handleAuthCallback,
      });
      gisInited = true;
      maybeEnableButtons();
    } catch (err) {
      console.error('GIS init error:', err);
    }
  };
  document.head.appendChild(script);
}

function maybeEnableButtons() {
  // Both APIs loaded — ready to use
}

/* ----------------------------------------------------------
 *  Login / Logout
 * ---------------------------------------------------------- */
function handleGCalLogin() {
  const C = SITE_CONFIG.googleCalendar;

  // If not configured, show the form anyway (without actual Google integration)
  if (C.clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
    showCalendarView();
    return;
  }

  if (!tokenClient) {
    console.error('Google Identity Services not loaded');
    showCalendarView(); // Show form as fallback
    return;
  }

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

function handleAuthCallback(resp) {
  if (resp.error) {
    console.error('Auth error:', resp);
    return;
  }
  showCalendarView();
}

function handleGCalLogout() {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
  }
  hideCalendarView();
}

function showCalendarView() {
  const loginBox = document.getElementById('gcal-login-box');
  const calView = document.getElementById('gcal-calendar-view');
  if (loginBox) loginBox.style.display = 'none';
  if (calView) calView.style.display = 'block';
}

function hideCalendarView() {
  const loginBox = document.getElementById('gcal-login-box');
  const calView = document.getElementById('gcal-calendar-view');
  if (loginBox) loginBox.style.display = 'block';
  if (calView) calView.style.display = 'none';
}

/* ----------------------------------------------------------
 *  Create Calendar Event
 * ---------------------------------------------------------- */
async function handleGCalBooking(e) {
  e.preventDefault();

  const name = document.getElementById('gcal-name').value;
  const email = document.getElementById('gcal-email').value;
  const date = document.getElementById('gcal-date').value;
  const time = document.getElementById('gcal-time').value;
  const service = document.getElementById('gcal-service').value;
  const notes = document.getElementById('gcal-notes').value;

  if (!date || !time) {
    window.showAlert('booking-error');
    return;
  }

  const startDateTime = `${date}T${time}:00`;
  const endHour = parseInt(time.split(':')[0]) + 1;
  const endMinutes = time.split(':')[1];
  const endDateTime = `${date}T${String(endHour).padStart(2, '0')}:${endMinutes}:00`;

  const C = SITE_CONFIG.googleCalendar;

  // If Google API is configured and authenticated, create a real event
  if (C.apiKey !== 'YOUR_GOOGLE_API_KEY' && gapi.client.getToken()) {
    try {
      const event = {
        summary: `Dunnwell Therapy - ${service || 'Consultation'} with ${name}`,
        description: `Client: ${name}\nEmail: ${email}\nService: ${service}\nNotes: ${notes}`,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        attendees: [
          { email: email },
          { email: SITE_CONFIG.emailPrimary },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      await gapi.client.calendar.events.insert({
        calendarId: C.calendarId,
        resource: event,
        sendUpdates: 'all',
      });

      window.showAlert('booking-success');
      e.target.reset();
      return;
    } catch (err) {
      console.error('Calendar event creation error:', err);
    }
  }

  // Fallback: send as email / mailto
  const subject = encodeURIComponent(`Google Calendar Booking - ${name}`);
  const body = encodeURIComponent(
    `Google Calendar Booking Request\n\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Date: ${date}\n` +
    `Time: ${time}\n` +
    `Service: ${service}\n` +
    `Notes: ${notes}\n`
  );
  window.location.href = `mailto:${SITE_CONFIG.emailPrimary}?cc=${SITE_CONFIG.emailSecondary}&subject=${subject}&body=${body}`;

  window.showAlert('booking-success');
  e.target.reset();
}
