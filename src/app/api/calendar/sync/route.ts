import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  syncWorkoutsToCalendar,
  getPrimaryCalendarId,
  isGoogleCalendarConfigured,
} from "@/lib/calendar"
import { getScheduleByPhase, getPhaseByWeek } from "@/lib/training-plan"
import { addDays, startOfWeek, setHours, setMinutes } from "date-fns"

// Default workout times (24-hour format)
const workoutTimes: Record<string, { hour: number; minute: number }> = {
  swim: { hour: 6, minute: 0 },       // 6:00 AM
  bike: { hour: 17, minute: 30 },     // 5:30 PM
  run: { hour: 18, minute: 30 },      // 6:30 PM
  lift_upper: { hour: 7, minute: 0 }, // 7:00 AM
  lift_lower: { hour: 7, minute: 0 }, // 7:00 AM
  brick: { hour: 17, minute: 0 },     // 5:00 PM
  rest: { hour: 9, minute: 0 },       // 9:00 AM
  mobility: { hour: 19, minute: 0 },  // 7:00 PM
}

// POST /api/calendar/sync - Sync workouts to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar not configured" },
        { status: 400 }
      )
    }

    // Get user with Google tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        googleAccessToken: true,
        googleCalendarId: true,
      },
    })

    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected. Please sign in with Google." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const week = body.week || 1
    const customTimes = body.workoutTimes || {}

    // Get calendar ID (use saved or find primary)
    let calendarId = user.googleCalendarId
    if (!calendarId) {
      try {
        calendarId = await getPrimaryCalendarId(user.googleAccessToken)
        // Save for future use
        await prisma.user.update({
          where: { id: session.user.id },
          data: { googleCalendarId: calendarId },
        })
      } catch {
        calendarId = "primary"
      }
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
        
        // If multiple workouts same day, stagger by 2 hours after first
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
      user.googleAccessToken,
      calendarId,
      workouts
    )

    return NextResponse.json({
      success: true,
      synced: eventIds.size,
      total: workouts.length,
      message: `Synced ${eventIds.size} of ${workouts.length} workouts to calendar`,
      eventIds: Object.fromEntries(eventIds),
    })
  } catch (error) {
    console.error("Error syncing to calendar:", error)
    return NextResponse.json(
      { error: "Failed to sync to calendar" },
      { status: 500 }
    )
  }
}

// DELETE /api/calendar/sync - Remove synced workouts
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        googleAccessToken: true,
        googleCalendarId: true,
      },
    })

    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      )
    }

    // Get event IDs from request body
    const body = await request.json()
    const eventIds: string[] = body.eventIds || []

    if (eventIds.length === 0) {
      return NextResponse.json({ success: true, removed: 0 })
    }

    const calendarId = user.googleCalendarId || "primary"
    let removed = 0

    // Delete each event
    for (const eventId of eventIds) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.googleAccessToken}`,
            },
          }
        )
        if (response.ok || response.status === 410) {
          removed++
        }
      } catch {
        console.error(`Failed to delete event ${eventId}`)
      }
    }

    return NextResponse.json({
      success: true,
      removed,
      total: eventIds.length,
    })
  } catch (error) {
    console.error("Error removing calendar events:", error)
    return NextResponse.json(
      { error: "Failed to remove calendar events" },
      { status: 500 }
    )
  }
}
