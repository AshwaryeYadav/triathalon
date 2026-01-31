// Google Calendar API Integration
// Documentation: https://developers.google.com/calendar/api/v3/reference

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  colorId?: string
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: "email" | "popup"
      minutes: number
    }>
  }
}

export interface CalendarList {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
}

// Color mapping for workout types (Google Calendar color IDs)
export const workoutColors: Record<string, string> = {
  swim: "9",       // Blue
  bike: "6",       // Orange
  run: "10",       // Green
  lift_upper: "3", // Purple
  lift_lower: "3", // Purple
  brick: "5",      // Yellow (multi-sport)
  rest: "8",       // Gray
  mobility: "7",   // Teal
}

// Workout type emojis
const workoutEmojis: Record<string, string> = {
  swim: "🏊",
  bike: "🚴",
  run: "🏃",
  lift_upper: "🏋️",
  lift_lower: "🦵",
  brick: "🔥",
  rest: "😴",
  mobility: "🧘",
}

// List user's calendars
export async function listCalendars(
  accessToken: string
): Promise<CalendarList[]> {
  const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to list calendars: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}

// Get primary calendar ID
export async function getPrimaryCalendarId(accessToken: string): Promise<string> {
  const calendars = await listCalendars(accessToken)
  const primary = calendars.find((c) => c.primary)
  return primary?.id || "primary"
}

// Create a calendar event
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEvent
): Promise<CalendarEvent> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create calendar event: ${error}`)
  }

  return response.json()
}

// Update a calendar event
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update calendar event: ${error}`)
  }

  return response.json()
}

// Delete a calendar event
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  // 410 Gone means already deleted - that's fine
  if (!response.ok && response.status !== 410) {
    const error = await response.text()
    throw new Error(`Failed to delete calendar event: ${error}`)
  }
}

// Get a calendar event
export async function getCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get calendar event: ${error}`)
  }

  return response.json()
}

// List events for a date range
export async function listCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  })

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to list calendar events: ${error}`)
  }

  const data = await response.json()
  return data.items || []
}

// Create a workout event object
export function createWorkoutEvent(
  workout: {
    title: string
    type: string
    description?: string
    duration: number
    notes?: string[]
  },
  scheduledDate: Date,
  timeZone = "America/New_York"
): CalendarEvent {
  const startTime = new Date(scheduledDate)
  const endTime = new Date(startTime.getTime() + workout.duration * 60 * 1000)

  // Build description
  let description = workout.description || ""
  if (workout.notes && workout.notes.length > 0) {
    description += "\n\n📝 Notes:\n" + workout.notes.map((n) => `• ${n}`).join("\n")
  }
  description += "\n\n---\nCreated by TriCoach 🏊‍♂️🚴🏃"

  const emoji = workoutEmojis[workout.type] || "💪"

  return {
    summary: `${emoji} ${workout.title}`,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    colorId: workoutColors[workout.type] || "1",
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "popup", minutes: 10 },
      ],
    },
  }
}

// Sync a single workout to calendar
export async function syncWorkoutToCalendar(
  accessToken: string,
  calendarId: string,
  workout: {
    id: string
    title: string
    type: string
    description?: string
    duration: number
    notes?: string[]
    scheduledDate: Date
    googleEventId?: string
  }
): Promise<string> {
  const event = createWorkoutEvent(workout, workout.scheduledDate)

  try {
    if (workout.googleEventId) {
      // Check if event still exists
      const existing = await getCalendarEvent(
        accessToken,
        calendarId,
        workout.googleEventId
      )

      if (existing) {
        // Update existing event
        await updateCalendarEvent(
          accessToken,
          calendarId,
          workout.googleEventId,
          event
        )
        return workout.googleEventId
      }
    }

    // Create new event
    const created = await createCalendarEvent(accessToken, calendarId, event)
    return created.id || ""
  } catch (error) {
    console.error(`Failed to sync workout ${workout.id}:`, error)
    throw error
  }
}

// Sync multiple workouts to calendar
export async function syncWorkoutsToCalendar(
  accessToken: string,
  calendarId: string,
  workouts: Array<{
    id: string
    title: string
    type: string
    description?: string
    duration: number
    notes?: string[]
    scheduledDate: Date
    googleEventId?: string
  }>
): Promise<Map<string, string>> {
  const eventIdMap = new Map<string, string>()

  for (const workout of workouts) {
    try {
      const eventId = await syncWorkoutToCalendar(accessToken, calendarId, workout)
      eventIdMap.set(workout.id, eventId)
    } catch (error) {
      console.error(`Failed to sync workout ${workout.id}:`, error)
      // Continue with other workouts
    }
  }

  return eventIdMap
}

// Remove a workout from calendar
export async function removeWorkoutFromCalendar(
  accessToken: string,
  calendarId: string,
  googleEventId: string
): Promise<void> {
  await deleteCalendarEvent(accessToken, calendarId, googleEventId)
}

// Check if Google Calendar is configured (via NextAuth Google provider)
export function isGoogleCalendarConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}
