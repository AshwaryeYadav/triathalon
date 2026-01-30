"use client"

import { motion } from "framer-motion"
import { 
  Waves, 
  Bike, 
  Footprints, 
  Dumbbell, 
  Flame, 
  Moon, 
  Sparkles,
  Clock,
  ChevronRight,
  Check,
  X
} from "lucide-react"
import type { WorkoutTemplate } from "@/lib/training-plan"

interface WorkoutCardProps {
  workout: WorkoutTemplate
  date?: Date
  status?: "scheduled" | "completed" | "skipped" | "adjusted"
  recoveryAdjusted?: boolean
  onClick?: () => void
  delay?: number
}

const workoutIcons: Record<string, typeof Waves> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  lift_upper: Dumbbell,
  lift_lower: Dumbbell,
  brick: Flame,
  rest: Moon,
  mobility: Sparkles,
}

const workoutColors: Record<string, string> = {
  swim: "var(--swim-blue)",
  bike: "var(--bike-orange)",
  run: "var(--run-green)",
  lift_upper: "var(--lift-purple)",
  lift_lower: "var(--lift-purple)",
  brick: "#ff6b35",
  rest: "var(--text-muted)",
  mobility: "#14b8a6",
}

const intensityLabels: Record<string, { label: string; color: string }> = {
  easy: { label: "Easy", color: "#22c55e" },
  moderate: { label: "Moderate", color: "#eab308" },
  hard: { label: "Hard", color: "#ef4444" },
  race_pace: { label: "Race Pace", color: "#f97316" },
}

export function WorkoutCard({
  workout,
  date,
  status = "scheduled",
  recoveryAdjusted = false,
  onClick,
  delay = 0,
}: WorkoutCardProps) {
  const Icon = workoutIcons[workout.type] || Dumbbell
  const color = workoutColors[workout.type] || "var(--text-primary)"
  const intensity = intensityLabels[workout.intensity] || intensityLabels.moderate

  return (
    <motion.div
      className={`glass-card p-4 cursor-pointer workout-${workout.type} relative overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Recovery adjustment indicator */}
      {recoveryAdjusted && (
        <div className="absolute top-2 right-2">
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            Adjusted
          </span>
        </div>
      )}

      {/* Status indicator */}
      {status === "completed" && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-400" />
          </div>
        </div>
      )}
      {status === "skipped" && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-4 h-4 text-red-400" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1 truncate">
            {workout.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] line-clamp-1 mb-2">
            {workout.description}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs">
            {workout.duration > 0 && (
              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                <Clock className="w-3 h-3" />
                <span>{workout.duration} min</span>
              </div>
            )}
            <div
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${intensity.color}20`,
                color: intensity.color,
              }}
            >
              {intensity.label}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
      </div>

      {/* Exercises preview */}
      {workout.exercises && workout.exercises.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">
            {workout.exercises.length} exercises
          </p>
          <div className="flex flex-wrap gap-2">
            {workout.exercises.slice(0, 3).map((exercise, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              >
                {exercise.name}
              </span>
            ))}
            {workout.exercises.length > 3 && (
              <span className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                +{workout.exercises.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
