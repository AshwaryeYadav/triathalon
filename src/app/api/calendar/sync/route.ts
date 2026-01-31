import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  syncWorkoutsToCalendar,
  getPrimaryCalendarId,
  isGoogleCalendarConfigured,
} from "@/lib/calendar"
import { getScheduleByPhase, getPhaseByWeek } from "@/lib/training-plan"
import { addDays, startOfWeek, setHours, setMinutes } from "date-fns"

// Default workout times (24-hour format)
const workoutTimes: Record<string, { hour: number; minute: number }> = {
  swim: { hour: 6, minute: 0 },
  bike: { hour: 17, minute: 30 },
  run: { hour: 18, minute: 30 },
  lift_upper: { hour: 7, minute: 0 },
  lift_lower: { hour: 7, minute: 0 },
  brick: { hour: 17, minute: 0 },
  rest: { hour: 9, minute: 0 },
  mobility: { hour: 19, minute: 0 },
}

// POST /api/calendar/sync - Sync workouts to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const session = await auth() as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables." },
        { status: 400 }
      )
    }

    // Get Google access token from session
    const googleAccessToken = session.googleAccessToken

    if (!googleAccessToken) {
      return NextResponse.json(
        { error: "Please sign in with Google to sync calendar. The demo login doesn't support calendar sync." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const week = body.week || 1
    const customTimes = body.workoutTimes || {}

    // Get calendar ID
    let calendarId: string
    try {
      calendarId = await getPrimaryCalendarId(googleAccessToken)
    } catch {
      calendarId = "primary"
    }

    // Get workouts for the week
    const phase = getPhaseByWeek(week)
    const schedule = getScheduleByPhase(phase.name)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

    // Build workout objects with scheduled times
    const workouts = schedule.flatMap((daySchedule) =>
      daySchedule.workouts.map((workout, index) => {
        const date = addDays(weekStart, daySchedule.dayOfWeek)
        const times = customTimes[workout.type] || workoutTimes[workout.type] || { hour: 9, minute: 0 }

        const adjustedHour = times.hour + (index * 2)
        const scheduledDate = setMinutes(setHours(date, adjustedHour), times.minute)

        return {
          id: `${week}-${daySchedule.dayOfWeek}-${index}`,
          title: workout.title,
          type: workout.type,
          description: workout.description,
          duration: workout.duration,
          notes: workout.notes,
          scheduledDate,
        }
      })
    )

    // Sync to calendar
    const eventIds = await syncWorkoutsToCalendar(
      googleAccessToken,
      calendarId,
      workouts
    )

    return NextResponse.json({
      success: true,
      synced: eventIds.size,
      total: workouts.length,
      message: `Synced ${eventIds.size} of ${workouts.length} workouts to calendar`,
    })
  } catch (error) {
    console.error("Error syncing to calendar:", error)
    return NextResponse.json(
      { error: "Failed to sync to calendar. Make sure you're signed in with Google." },
      { status: 500 }
    )
  }
}
