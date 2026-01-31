"use client"

import { motion } from "framer-motion"
import {
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Waves,
  Bike,
  Footprints,
  Dumbbell,
  Flame,
  Sparkles,
} from "lucide-react"
import type { WorkoutTemplate } from "@/lib/training-plan"
import type { LoggedWorkout } from "./LogWorkoutModal"

interface NextWorkoutCardProps {
  originalWorkout: WorkoutTemplate
  adjustedWorkout: WorkoutTemplate
  reason: string
  adjustmentType: "recovery" | "logged" | "none"
  lastLoggedWorkout?: LoggedWorkout | null
}

const workoutIcons: Record<string, typeof Waves> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  lift_upper: Dumbbell,
  lift_lower: Dumbbell,
  brick: Flame,
  mobility: Sparkles,
}

const workoutColors: Record<string, string> = {
  swim: "var(--swim-blue)",
  bike: "var(--bike-orange)",
  run: "var(--run-green)",
  lift_upper: "var(--lift-purple)",
  lift_lower: "var(--lift-purple)",
  brick: "#ff6b35",
  mobility: "#14b8a6",
}

export function NextWorkoutCard({
  originalWorkout,
  adjustedWorkout,
  reason,
  adjustmentType,
  lastLoggedWorkout,
}: NextWorkoutCardProps) {
  const Icon = workoutIcons[adjustedWorkout.type] || Zap
  const color = workoutColors[adjustedWorkout.type] || "var(--swim-blue)"

  const durationChange = adjustedWorkout.duration - originalWorkout.duration
  const intensityChanged = adjustedWorkout.intensity !== originalWorkout.intensity

  const isReduced = durationChange < 0 || 
    (intensityChanged && 
      (originalWorkout.intensity === "hard" && adjustedWorkout.intensity !== "hard"))

  return (
    <motion.div
      className="glass-card p-5 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Adjustment badge */}
      {adjustmentType !== "none" && (
        <div className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
          isReduced 
            ? "bg-yellow-500/20 text-yellow-400" 
            : "bg-green-500/20 text-green-400"
        }`}>
          {isReduced ? (
            <>
              <TrendingDown className="w-3 h-3" />
              Adjusted
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3" />
              On Track
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-[var(--bike-orange)]" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Next Workout
        </h3>
      </div>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-lg mb-1">
            {adjustedWorkout.title}
          </h4>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            {adjustedWorkout.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-white font-medium">{adjustedWorkout.duration} min</span>
              {durationChange !== 0 && (
                <span className={`text-xs ${durationChange < 0 ? "text-yellow-400" : "text-green-400"}`}>
                  ({durationChange > 0 ? "+" : ""}{durationChange})
                </span>
              )}
            </div>
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              adjustedWorkout.intensity === "easy" ? "bg-green-500/20 text-green-400" :
              adjustedWorkout.intensity === "moderate" ? "bg-yellow-500/20 text-yellow-400" :
              adjustedWorkout.intensity === "hard" ? "bg-red-500/20 text-red-400" :
              "bg-orange-500/20 text-orange-400"
            }`}>
              {adjustedWorkout.intensity.replace("_", " ")}
              {intensityChanged && (
                <span className="ml-1 opacity-70">
                  (was {originalWorkout.intensity})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Adjustment reason */}
      {adjustmentType !== "none" && reason && (
        <div className={`mt-4 p-3 rounded-xl text-sm ${
          isReduced 
            ? "bg-yellow-500/10 border border-yellow-500/20" 
            : "bg-green-500/10 border border-green-500/20"
        }`}>
          <div className="flex items-start gap-2">
            {isReduced ? (
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={isReduced ? "text-yellow-400" : "text-green-400"}>
                {reason}
              </p>
              {lastLoggedWorkout && adjustmentType === "logged" && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Based on your {lastLoggedWorkout.title} ({lastLoggedWorkout.actualDuration} min, RPE {lastLoggedWorkout.perceivedEffort})
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Calculate workout adjustments based on logged workout
export function calculateWorkoutAdjustment(
  nextWorkout: WorkoutTemplate,
  loggedWorkout: LoggedWorkout | null,
  recoveryScore: number
): {
  adjustedWorkout: WorkoutTemplate
  reason: string
  adjustmentType: "recovery" | "logged" | "none"
} {
  let adjustedWorkout = { ...nextWorkout }
  let reason = ""
  let adjustmentType: "recovery" | "logged" | "none" = "none"

  // First, apply recovery-based adjustments
  if (recoveryScore < 67) {
    adjustmentType = "recovery"
    if (recoveryScore < 34) {
      // Very low recovery
      adjustedWorkout = {
        ...adjustedWorkout,
        duration: Math.round(nextWorkout.duration * 0.6),
        intensity: "easy" as const,
      }
      reason = `Your recovery is low (${recoveryScore}%). Reducing volume by 40% and intensity to easy.`
    } else {
      // Moderate recovery
      adjustedWorkout = {
        ...adjustedWorkout,
        duration: Math.round(nextWorkout.duration * 0.85),
        intensity: nextWorkout.intensity === "hard" ? "moderate" as const : nextWorkout.intensity,
      }
      reason = `Recovery at ${recoveryScore}%. Slightly reduced volume and intensity.`
    }
  }

  // Then, apply logged workout adjustments (these stack)
  if (loggedWorkout) {
    const timeSinceLogged = Date.now() - new Date(loggedWorkout.timestamp).getTime()
    const hoursAgo = timeSinceLogged / (1000 * 60 * 60)

    // Only consider workouts logged in the last 24 hours
    if (hoursAgo < 24) {
      // High RPE logged workout = reduce next workout
      if (loggedWorkout.perceivedEffort >= 8) {
        adjustmentType = "logged"
        const reduction = loggedWorkout.perceivedEffort >= 9 ? 0.7 : 0.85
        adjustedWorkout = {
          ...adjustedWorkout,
          duration: Math.round(adjustedWorkout.duration * reduction),
          intensity: adjustedWorkout.intensity === "hard" ? "moderate" as const : adjustedWorkout.intensity,
        }
        reason = `You pushed hard (RPE ${loggedWorkout.perceivedEffort}) in your last workout. Reducing today's load to aid recovery.`
      }
      // Workout was harder than planned
      else if (loggedWorkout.actualIntensity === "harder" || 
               loggedWorkout.actualDuration > loggedWorkout.plannedDuration * 1.2) {
        adjustmentType = "logged"
        adjustedWorkout = {
          ...adjustedWorkout,
          duration: Math.round(adjustedWorkout.duration * 0.9),
        }
        reason = `Your last workout was more intense than planned. Slightly reducing today's volume.`
      }
      // Workout was easier than planned - can maintain or slightly increase
      else if (loggedWorkout.actualIntensity === "easier" && loggedWorkout.perceivedEffort <= 4) {
        if (recoveryScore >= 67) {
          adjustmentType = "logged"
          adjustedWorkout = {
            ...adjustedWorkout,
            duration: Math.round(adjustedWorkout.duration * 1.05),
          }
          reason = `Last workout felt easy and your recovery is good. You can push a bit more today!`
        }
      }
    }
  }

  // If no adjustments, provide positive feedback
  if (adjustmentType === "none") {
    reason = "Looking good! Train as planned."
  }

  return { adjustedWorkout, reason, adjustmentType }
}
