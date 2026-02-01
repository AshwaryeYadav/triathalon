import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getWhoopWorkouts, getTodaysWhoopData } from "@/lib/whoop"
import {
  detectWorkoutType,
  matchWorkoutsForDay,
  getNextWorkoutAdjustments,
  getScheduleByPhase,
  getPhaseByWeek,
  DetectedWorkout,
} from "@/lib/training-plan"

// Get today's day index (0 = Monday)
function getTodayIndex(): number {
  const day = new Date().getDay()
  // Convert from Sunday = 0 to Monday = 0
  return day === 0 ? 6 : day - 1
}

// Get current week number since start of training plan
function getCurrentWeek(): number {
  const planStartDate = new Date("2026-02-01") // Adjust to actual start date
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - planStartDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.ceil(diffDays / 7)
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("whoop_access_token")?.value

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: "Whoop not connected",
        detectedWorkouts: [],
        matches: [],
        tomorrowAdjustments: [],
      })
    }

    // Fetch today's Whoop data (recovery + workouts)
    const [whoopData, whoopWorkouts] = await Promise.all([
      getTodaysWhoopData(accessToken),
      getWhoopWorkouts(accessToken, 10), // Get recent workouts
    ])

    // Filter to today's workouts only
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaysWorkouts = whoopWorkouts.filter((w) => {
      const workoutDate = new Date(w.start)
      return workoutDate >= today && workoutDate < tomorrow
    })

    // Convert to DetectedWorkout format
    const detectedWorkouts: DetectedWorkout[] = todaysWorkouts.map((w) => ({
      id: w.id,
      sport: w.sport_name,
      matchedType: detectWorkoutType(w.sport_name),
      strain: w.score?.strain ?? 0,
      duration: Math.round(
        (new Date(w.end).getTime() - new Date(w.start).getTime()) / 60000
      ),
      calories: w.score?.kilojoule ? Math.round(w.score.kilojoule * 0.239) : 0,
      averageHR: w.score?.average_heart_rate ?? 0,
      maxHR: w.score?.max_heart_rate ?? 0,
      distance: w.score?.distance_meter
        ? Math.round(w.score.distance_meter)
        : null,
      start: w.start,
      end: w.end,
    }))

    // Get today's planned workouts
    const currentWeek = getCurrentWeek()
    const phase = getPhaseByWeek(currentWeek)
    const schedule = getScheduleByPhase(phase.name)
    const todayIndex = getTodayIndex()
    const todaySchedule = schedule.find((d) => d.dayOfWeek === todayIndex)
    const plannedWorkouts = todaySchedule?.workouts ?? []

    // Match detected workouts to planned workouts
    const recoveryScore = whoopData.recovery.score
    const matches = matchWorkoutsForDay(
      detectedWorkouts,
      plannedWorkouts,
      recoveryScore
    )

    // Get tomorrow's adjustments
    const tomorrowIndex = (todayIndex + 1) % 7
    const tomorrowSchedule = schedule.find((d) => d.dayOfWeek === tomorrowIndex)
    const tomorrowWorkouts = tomorrowSchedule?.workouts ?? []
    const tomorrowAdjustments = getNextWorkoutAdjustments(
      matches,
      recoveryScore,
      tomorrowWorkouts
    )

    // Calculate summary stats
    const completedCount = matches.filter((m) => m.matchScore >= 40).length
    const totalPlanned = plannedWorkouts.length
    const extraWorkouts = matches.filter((m) => m.isExtraWorkout).length
    const totalStrain = detectedWorkouts.reduce((sum, w) => sum + w.strain, 0)

    return NextResponse.json({
      success: true,
      summary: {
        completedCount,
        totalPlanned,
        extraWorkouts,
        totalStrain: totalStrain.toFixed(1),
        recoveryScore,
        currentWeek,
        phase: phase.name,
      },
      detectedWorkouts,
      matches: matches.map((m) => ({
        detected: {
          id: m.detected.id,
          sport: m.detected.sport,
          type: m.detected.matchedType,
          strain: m.detected.strain,
          duration: m.detected.duration,
        },
        planned: m.planned
          ? {
              title: m.planned.title,
              type: m.planned.type,
              duration: m.planned.duration,
              intensity: m.planned.intensity,
            }
          : null,
        matchScore: m.matchScore,
        isExtra: m.isExtraWorkout,
        adjustment: m.adjustmentNeeded,
      })),
      tomorrowAdjustments: tomorrowAdjustments.map((a) => ({
        title: a.workout.title,
        type: a.workout.type,
        originalDuration: a.workout.duration,
        newDuration: a.newDuration,
        adjustment: a.adjustment,
        skip: a.skip,
      })),
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Workout sync error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        detectedWorkouts: [],
        matches: [],
        tomorrowAdjustments: [],
      },
      { status: 500 }
    )
  }
}
