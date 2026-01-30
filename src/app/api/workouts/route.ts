import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
  getPhaseByWeek,
  getScheduleByPhase,
} from "@/lib/training-plan"
import { addDays, startOfWeek } from "date-fns"

// GET /api/workouts - Get workouts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // Demo mode - return generated workouts
    const searchParams = request.nextUrl.searchParams
    const weekParam = searchParams.get("week")
    const week = weekParam ? parseInt(weekParam) : 1

    const phase = getPhaseByWeek(week)
    const schedule = getScheduleByPhase(phase.name)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

    const workouts = schedule.flatMap((daySchedule) =>
      daySchedule.workouts.map((workout, index) => ({
        id: `${week}-${daySchedule.dayOfWeek}-${index}`,
        ...workout,
        phase: phase.name,
        week,
        dayOfWeek: daySchedule.dayOfWeek,
        dayName: daySchedule.dayName,
        scheduledDate: addDays(weekStart, daySchedule.dayOfWeek).toISOString(),
        status: "scheduled",
      }))
    )

    return NextResponse.json({ workouts, phase })
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json(
      { error: "Failed to fetch workouts" },
      { status: 500 }
    )
  }
}

// POST /api/workouts - Create a new workout
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const workout = await prisma.workout.create({
      data: {
        userId: session.user.id,
        title: body.title,
        description: body.description,
        type: body.type,
        phase: body.phase,
        week: body.week,
        dayOfWeek: body.dayOfWeek,
        plannedDuration: body.duration,
        plannedIntensity: body.intensity,
        exercises: body.exercises ? JSON.stringify(body.exercises) : null,
        notes: body.notes ? body.notes.join("\n") : null,
        scheduledDate: new Date(body.scheduledDate),
      },
    })

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("Error creating workout:", error)
    return NextResponse.json(
      { error: "Failed to create workout" },
      { status: 500 }
    )
  }
}
