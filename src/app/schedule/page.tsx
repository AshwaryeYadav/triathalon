"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Waves,
  Bike,
  Footprints,
  Dumbbell,
  Flame,
  Moon,
  Sparkles,
  AlertTriangle,
  Check,
  RefreshCw,
} from "lucide-react"
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns"
import { WorkoutModal } from "@/components"
import {
  getPhaseByWeek,
  getScheduleByPhase,
  getRecoveryAdjustment,
  type WorkoutTemplate,
} from "@/lib/training-plan"

interface WhoopData {
  recovery: {
    score: number
    hrv: number
    restingHR: number
    sleepPerformance: number
  }
  strain: {
    dayStrain: number
    calories: number
    averageHR: number
  }
  sleep: {
    duration: number
    efficiency: number
  }
}

const workoutTypeIcons: Record<string, typeof Waves> = {
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

export default function SchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set())

  // Calculate week number
  const startDate = new Date("2026-01-30")
  const weekNumber = Math.ceil(
    (currentWeekStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  ) + 1
  const clampedWeek = Math.min(Math.max(weekNumber, 1), 10)

  const currentPhase = getPhaseByWeek(clampedWeek)
  const schedule = getScheduleByPhase(currentPhase.name)

  // Get recovery score and adjustment
  const recoveryScore = whoopData?.recovery.score || 70
  const recoveryAdjustment = getRecoveryAdjustment(recoveryScore)

  // Fetch Whoop data
  const fetchWhoopData = useCallback(async () => {
    try {
      const res = await fetch("/api/whoop")
      const data = await res.json()
      if (data.data) {
        setWhoopData(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch Whoop data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWhoopData()
    // Load completed workouts from localStorage
    const completed = localStorage.getItem("completedWorkouts")
    if (completed) setCompletedWorkouts(new Set(JSON.parse(completed)))
  }, [fetchWhoopData])

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)
    )
  }

  // Adjust workout based on recovery
  const getAdjustedWorkout = (workout: WorkoutTemplate): WorkoutTemplate => {
    if (recoveryScore >= 67) return workout
    if (workout.type === "rest" || workout.type === "mobility") return workout

    const adjustment = recoveryAdjustment.adjustments
    return {
      ...workout,
      duration: Math.round(workout.duration * adjustment.volumeModifier),
      intensity: recoveryScore < 34 ? "easy" : 
                 workout.intensity === "hard" ? "moderate" : workout.intensity,
      exercises: workout.exercises?.map(ex => ({
        ...ex,
        sets: Math.max(2, Math.round(ex.sets * adjustment.volumeModifier)),
      })),
    }
  }

  const handleCompleteWorkout = (workoutTitle: string) => {
    const newCompleted = new Set([...completedWorkouts, workoutTitle])
    setCompletedWorkouts(newCompleted)
    localStorage.setItem("completedWorkouts", JSON.stringify([...newCompleted]))
    setIsModalOpen(false)
  }

  // Check if viewing current week
  const isCurrentWeek = format(currentWeekStart, "yyyy-MM-dd") === 
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--swim-blue)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Training Schedule</h1>
            <p className="text-[var(--text-secondary)]">
              Week {clampedWeek} • {currentPhase.description} Phase
            </p>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek("prev")}
              disabled={clampedWeek <= 1}
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="text-center min-w-[200px]">
              <div className="text-sm text-[var(--text-muted)]">Week of</div>
              <div className="text-lg font-semibold text-white">
                {format(currentWeekStart, "MMM d")} -{" "}
                {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
              </div>
            </div>
            <button
              onClick={() => navigateWeek("next")}
              disabled={clampedWeek >= 10}
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Recovery Alert Banner (only for current week) */}
        {isCurrentWeek && recoveryScore < 67 && whoopData && (
          <motion.div
            className={`mb-6 p-4 rounded-xl border ${
              recoveryScore < 34
                ? "bg-red-500/10 border-red-500/30"
                : "bg-yellow-500/10 border-yellow-500/30"
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 flex-shrink-0 ${
                  recoveryScore < 34 ? "text-red-400" : "text-yellow-400"
                }`}
              />
              <div>
                <p className={`text-sm font-medium ${
                  recoveryScore < 34 ? "text-red-400" : "text-yellow-400"
                }`}>
                  Recovery Score: {recoveryScore}% — {recoveryAdjustment.adjustments.recommendation}
                </p>
                <p className={`text-xs mt-1 ${
                  recoveryScore < 34 ? "text-red-400/70" : "text-yellow-400/70"
                }`}>
                  Today's workouts are automatically adjusted to {Math.round(recoveryAdjustment.adjustments.volumeModifier * 100)}% volume
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase Info Card */}
        <motion.div
          className="glass-card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {currentPhase.description} Phase
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                <span>🏋️ Lifting: {currentPhase.liftingFrequency}x/week</span>
                <span>🏃 Max Run: {currentPhase.runVolumeCap} min/week</span>
                {whoopData && (
                  <span className={`${
                    recoveryScore >= 67 ? "text-green-400" :
                    recoveryScore >= 34 ? "text-yellow-400" : "text-red-400"
                  }`}>
                    ❤️ Recovery: {recoveryScore}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPhase.goals.map((goal, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)]"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Weekly Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {schedule.map((daySchedule, index) => {
            const date = addDays(currentWeekStart, index)
            const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
            const totalDuration = daySchedule.workouts.reduce((sum, w) => {
              const adjusted = isCurrentWeek ? getAdjustedWorkout(w) : w
              return sum + adjusted.duration
            }, 0)

            return (
              <motion.div
                key={daySchedule.dayOfWeek}
                className={`glass-card p-4 ${
                  isToday ? "ring-2 ring-[var(--swim-blue)]" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {daySchedule.dayName}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {format(date, "MMM d")}
                    </div>
                  </div>
                  {isToday && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--swim-blue)]/20 text-[var(--swim-blue)]">
                      Today
                    </span>
                  )}
                </div>

                {/* Workouts */}
                <div className="space-y-3">
                  {daySchedule.workouts.map((workout, wIndex) => {
                    const adjustedWorkout = isCurrentWeek ? getAdjustedWorkout(workout) : workout
                    const Icon = workoutTypeIcons[workout.type] || Dumbbell
                    const color = workoutColors[workout.type]
                    const isCompleted = completedWorkouts.has(workout.title)
                    const isAdjusted = isCurrentWeek && recoveryScore < 67 && 
                      workout.type !== "rest" && workout.type !== "mobility"

                    return (
                      <motion.button
                        key={wIndex}
                        className={`w-full text-left p-3 rounded-xl transition-colors relative ${
                          isCompleted 
                            ? "bg-green-500/10 hover:bg-green-500/20" 
                            : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)]"
                        }`}
                        onClick={() => {
                          setSelectedWorkout(adjustedWorkout)
                          setIsModalOpen(true)
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Completed checkmark */}
                        {isCompleted && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-green-400" />
                          </div>
                        )}

                        {/* Adjusted indicator */}
                        {isAdjusted && !isCompleted && (
                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                              Adj
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-medium truncate ${
                              isCompleted ? "text-green-400" : "text-white"
                            }`}>
                              {workout.title}
                            </div>
                            {adjustedWorkout.duration > 0 && (
                              <div className="text-xs text-[var(--text-muted)]">
                                {adjustedWorkout.duration} min
                                {isAdjusted && workout.duration !== adjustedWorkout.duration && (
                                  <span className="line-through ml-1 opacity-50">
                                    {workout.duration}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Total Duration */}
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-muted)]">
                    Total: {totalDuration} min
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Legend */}
        <motion.div
          className="mt-8 glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
            Workout Types
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(workoutTypeIcons).map(([type, Icon]) => {
              const color = workoutColors[type]
              const labels: Record<string, string> = {
                swim: "Swim",
                bike: "Bike",
                run: "Run",
                lift_upper: "Upper Body",
                lift_lower: "Lower Body",
                brick: "Brick",
                rest: "Rest",
                mobility: "Mobility",
              }

              return (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-3 h-3" style={{ color }} />
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {labels[type]}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Workout Modal */}
      <WorkoutModal
        workout={selectedWorkout}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => {
          if (selectedWorkout) handleCompleteWorkout(selectedWorkout.title)
        }}
        onSkip={() => setIsModalOpen(false)}
        recoveryScore={isCurrentWeek ? recoveryScore : undefined}
        adjustedWorkout={
          selectedWorkout && isCurrentWeek && recoveryScore < 67 
            ? getAdjustedWorkout(selectedWorkout) 
            : undefined
        }
      />
    </div>
  )
}
