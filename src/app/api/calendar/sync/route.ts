import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { syncWorkoutsToCalendar, createWorkoutEvent } from "@/lib/calendar"
import { getScheduleByPhase, getPhaseByWeek } from "@/lib/training-plan"
import { addDays, startOfWeek } from "date-fns"

// POST /api/calendar/sync - Sync workouts to Google Calendar
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user?.googleAccessToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const week = body.week || 1
    const calendarId = user.googleCalendarId || "primary"

    // Get workouts for the week
    const phase = getPhaseByWeek(week)
    const schedule = getScheduleByPhase(phase.name)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

    const workouts = schedule.flatMap((daySchedule) =>
      daySchedule.workouts.map((workout, index) => ({
        id: `${week}-${daySchedule.dayOfWeek}-${index}`,
        title: workout.title,
        type: workout.type,
        description: workout.description,
        duration: workout.duration,
        notes: workout.notes,
        scheduledDate: addDays(weekStart, daySchedule.dayOfWeek),
      }))
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
      message: `Synced ${eventIds.size} workouts to calendar`,
    })
  } catch (error) {
    console.error("Error syncing to calendar:", error)
    return NextResponse.json(
      { error: "Failed to sync to calendar" },
      { status: 500 }
    )
  }
}
