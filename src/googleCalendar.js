// ── Google Calendar API integration (API Key — calendários públicos) ──────────
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export async function fetchCalendarEvents(calendarId, timeMin, timeMax) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) throw new Error("VITE_GOOGLE_API_KEY não configurada no .env.local");

  const params = new URLSearchParams({
    key: apiKey,
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: "250",
  });

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`
  );
  if (res.status === 403) throw new Error("Acesso negado — verifique se a agenda é pública e a API Key está correta");
  if (res.status === 404) throw new Error("Agenda não encontrada — verifique o Calendar ID");
  if (!res.ok) throw new Error(`Google Calendar API: erro ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export function parseGoogleEvent(event, location) {
  if (!event.start?.dateTime) return null; // ignora eventos de dia inteiro
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
