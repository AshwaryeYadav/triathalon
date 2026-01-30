// Google Calendar Integration

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
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

// Color mapping for workout types
export const workoutColors: Record<string, string> = {
  swim: "9",      // Blue
  bike: "6",      // Orange
  run: "10",      // Green
  lift_upper: "3", // Purple
  lift_lower: "3", // Purple
  brick: "5",     // Yellow (multi-sport)
  rest: "8",      // Gray
  mobility: "7",  // Teal
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
    throw new Error(`Failed to update calendar event: ${response.statusText}`)
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

  if (!response.ok && response.status !== 410) {
    throw new Error(`Failed to delete calendar event: ${response.statusText}`)
  }
}

// List user's calendars
export async function listCalendars(
  accessToken: string
): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/users/me/calendarList`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to list calendars: ${response.statusText}`)
  }

  const data = await response.json()
  return data.items || []
}

// Create a workout event
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

  let description = workout.description || ""
  if (workout.notes && workout.notes.length > 0) {
    description += "\n\n📝 Notes:\n" + workout.notes.map(n => `• ${n}`).join("\n")
  }

  // Add workout type emoji
  const typeEmoji: Record<string, string> = {
    swim: "🏊",
    bike: "🚴",
    run: "🏃",
    lift_upper: "🏋️",
    lift_lower: "🦵",
    brick: "🔥",
    rest: "😴",
    mobility: "🧘",
  }

  const emoji = typeEmoji[workout.type] || "💪"

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

// Sync workouts to calendar
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
    const event = createWorkoutEvent(workout, workout.scheduledDate)

    try {
      if (workout.googleEventId) {
        // Update existing event
        await updateCalendarEvent(
          accessToken,
          calendarId,
          workout.googleEventId,
          event
        )
        eventIdMap.set(workout.id, workout.googleEventId)
      } else {
        // Create new event
        const created = await createCalendarEvent(accessToken, calendarId, event)
        if (created.id) {
          eventIdMap.set(workout.id, created.id)
        }
      }
    } catch (error) {
      console.error(`Failed to sync workout ${workout.id}:`, error)
    }
  }

  return eventIdMap
}
