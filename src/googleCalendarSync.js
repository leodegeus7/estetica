// ── Google Calendar sync logic ────────────────────────────────────────────────
import { fetchCalendarEvents, parseGoogleEvent } from "./googleCalendar";
import * as db from "./db";

const MAPPINGS_KEY = "gcal_mappings_v2";

export const DEFAULT_MAPPINGS = [
  {
    calendarId: "afdead33d422a48f3bf9db4f0b2e6c9242effce0670a6f5dc722539a6159cc8c@group.calendar.google.com",
    label: "Agenda Clínica",
    location: "Clínica",
  },
  {
    calendarId: "17739a13262abf7c80ebdcdd598ae2cd6003b5d2b2a60dc21c88cd289ec6009f@group.calendar.google.com",
    label: "Pacientes Externos",
    location: "",
  },
];

export function loadMappings() {
  try {
    const raw = localStorage.getItem(MAPPINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return DEFAULT_MAPPINGS;
}

export function saveMappings(mappings) {
  localStorage.setItem(MAPPINGS_KEY, JSON.stringify(mappings));
}

// Returns array of newly created draft appointments
export async function syncGoogleCalendars(mappings) {
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 7);
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + 60);

  const existingIds = await db.fetchGoogleEventIds();
  const newDrafts = [];

  for (const mapping of mappings) {
    if (!mapping.calendarId || !mapping.location) continue;
    try {
      const events = await fetchCalendarEvents(mapping.calendarId, timeMin, timeMax);
      for (const event of events) {
        if (existingIds.has(event.id)) continue;
        const draft = parseGoogleEvent(event, mapping.location);
        if (!draft) continue;
        const created = await db.createDraftAppointment(draft);
        existingIds.add(event.id);
        newDrafts.push(created);
      }
    } catch (err) {
      console.error(`[GCal] Erro ao sincronizar "${mapping.label}":`, err.message);
      throw err;
    }
  }

  return newDrafts;
}
