// ── Google Calendar API integration ──────────────────────────────────────────
// Uses @react-oauth/google for OAuth 2.0 + direct REST calls to Calendar API

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const TOKEN_KEY = "gcal_access_token";

export const CALENDAR_SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

// ── Token management (localStorage) ──────────────────────────────────────────

export function saveToken(tokenResponse) {
  const token = {
    access_token: tokenResponse.access_token,
    expires_at: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  return token;
}

export function loadToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw);
    // Consider expired 2 minutes before actual expiry
    if (Date.now() > token.expires_at - 120_000) return null;
    return token;
  } catch {
    return null;
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Calendar API calls ────────────────────────────────────────────────────────

export async function fetchCalendarEvents(accessToken, calendarId, timeMin, timeMax) {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: "250",
  });
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (res.status === 401) {
    clearToken();
    throw new Error("Token expirado — reconecte o Google Calendar");
  }
  if (!res.ok) throw new Error(`Google Calendar API: erro ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function fetchCalendarInfo(accessToken, calendarId) {
  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}

// ── Event parsing ─────────────────────────────────────────────────────────────

export function parseGoogleEvent(event, location) {
  // Skip all-day events (no time)
  if (!event.start?.dateTime) return null;
  // Skip cancelled occurrences
  if (event.status === "cancelled") return null;

  const startDt = new Date(event.start.dateTime);
  const endDt = new Date(event.end.dateTime);
  const date = startDt.toISOString().slice(0, 10);
  const time = startDt.toTimeString().slice(0, 5);
  const duration = Math.max(15, Math.round((endDt - startDt) / 60_000));

  return {
    date,
    time,
    duration,
    draftTitle: event.summary || "Sem título",
    googleEventId: event.id,
    location: location || "Clínica",
    source: "google",
    status: "draft",
  };
}
