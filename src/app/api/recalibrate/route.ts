import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getRecoveryAdjustment, type WorkoutTemplate } from "@/lib/training-plan"

// POST /api/recalibrate - Recalibrate workouts based on recovery
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recoveryScore, workouts } = body

    if (typeof recoveryScore !== "number" || !Array.isArray(workouts)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    // Get adjustment based on recovery score
    const adjustment = getRecoveryAdjustment(recoveryScore)

    // Apply adjustments to workouts
    const adjustedWorkouts = workouts.map((workout: WorkoutTemplate) => {
      // Skip rest and mobility - no adjustment needed
      if (workout.type === "rest" || workout.type === "mobility") {
        return {
          ...workout,
          wasRecalibrated: false,
        }
      }

      // Calculate adjusted duration
      const adjustedDuration = Math.round(
        workout.duration * adjustment.adjustments.volumeModifier
      )

      // Map intensity to adjusted intensity
      const intensityMap: Record<string, string> = {
        race_pace: adjustment.adjustments.intensityModifier < 0.7 ? "moderate" : "hard",
        hard: adjustment.adjustments.intensityModifier < 0.6 ? "easy" : adjustment.adjustments.intensityModifier < 0.9 ? "moderate" : "hard",
        moderate: adjustment.adjustments.intensityModifier < 0.6 ? "easy" : "moderate",
        easy: "easy",
      }

      const adjustedIntensity = intensityMap[workout.intensity] || workout.intensity

      // For low recovery, reduce sets/reps in exercises
      let adjustedExercises = workout.exercises
      if (workout.exercises && adjustment.adjustments.volumeModifier < 0.8) {
        adjustedExercises = workout.exercises.map((ex) => ({
          ...ex,
          sets: Math.max(2, Math.round(ex.sets * adjustment.adjustments.volumeModifier)),
        }))
      }

      return {
        ...workout,
        duration: adjustedDuration,
        intensity: adjustedIntensity,
        exercises: adjustedExercises,
        wasRecalibrated: true,
        recalibrationReason: adjustment.adjustments.recommendation,
        originalDuration: workout.duration,
        originalIntensity: workout.intensity,
      }
    })

    // Determine recommended action
    let action = "proceed"
    let message = adjustment.adjustments.recommendation

    if (recoveryScore < 34) {
      action = "rest_recommended"
      message = "Your recovery is very low. Consider taking a rest day or doing light mobility work only."
    } else if (recoveryScore < 50) {
      action = "reduce_intensity"
      message = "Recovery is below optimal. We've reduced your workout intensity and volume."
    }

    return NextResponse.json({
      action,
      message,
      recoveryScore,
      adjustments: {
        intensityModifier: adjustment.adjustments.intensityModifier,
        volumeModifier: adjustment.adjustments.volumeModifier,
      },
      workouts: adjustedWorkouts,
    })
  } catch (error) {
    console.error("Error recalibrating workouts:", error)
    return NextResponse.json(
      { error: "Failed to recalibrate workouts" },
      { status: 500 }
    )
  }
}
