import { google } from "googleapis"
import { JWT } from "google-auth-library"

const SCOPES = ["https://www.googleapis.com/auth/calendar"]

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!email || !key) return null
  return new JWT({ email, key, scopes: SCOPES })
}

export async function createCalendarEvent({
  summary,
  description,
  startDateTime,
  endDateTime,
  calendarId,
}: {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  calendarId: string
}) {
  const auth = getAuth()
  if (!auth) throw new Error("Google Calendar não configurado. Configure GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY no .env")

  const calendar = google.calendar({ version: "v3", auth })

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startDateTime, timeZone: "America/Sao_Paulo" },
      end: { dateTime: endDateTime, timeZone: "America/Sao_Paulo" },
    },
  })

  return event.data
}

export async function listEvents({
  calendarId,
  date,
}: {
  calendarId: string
  date: string
}) {
  const auth = getAuth()
  if (!auth) return []

  const calendar = google.calendar({ version: "v3", auth })

  const res = await calendar.events.list({
    calendarId,
    timeMin: new Date(`${date}T00:00:00-03:00`).toISOString(),
    timeMax: new Date(`${date}T23:59:59-03:00`).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  })

  return res.data.items ?? []
}
