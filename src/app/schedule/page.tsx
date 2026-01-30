"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Waves,
  Bike,
  Footprints,
  Dumbbell,
  Flame,
  Moon,
  Sparkles,
} from "lucide-react"
import { format, addWeeks, subWeeks, startOfWeek, addDays } from "date-fns"
import { WorkoutCard, WorkoutModal } from "@/components"
import {
  getPhaseByWeek,
  getScheduleByPhase,
  type WorkoutTemplate,
} from "@/lib/training-plan"

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

export default function SchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate week number
  const startDate = new Date("2026-01-30")
  const weekNumber = Math.ceil(
    (currentWeekStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  ) + 1
  const clampedWeek = Math.min(Math.max(weekNumber, 1), 10)

  const currentPhase = getPhaseByWeek(clampedWeek)
  const schedule = getScheduleByPhase(currentPhase.name)

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)
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
                <span>
                  🏋️ Lifting: {currentPhase.liftingFrequency}x/week
                </span>
                <span>
                  🏃 Max Run: {currentPhase.runVolumeCap} min/week
                </span>
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
            const isToday =
              format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

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
                    const Icon = workoutTypeIcons[workout.type] || Dumbbell
                    const colors: Record<string, string> = {
                      swim: "var(--swim-blue)",
                      bike: "var(--bike-orange)",
                      run: "var(--run-green)",
                      lift_upper: "var(--lift-purple)",
                      lift_lower: "var(--lift-purple)",
                      brick: "#ff6b35",
                      rest: "var(--text-muted)",
                      mobility: "#14b8a6",
                    }
                    const color = colors[workout.type]

                    return (
                      <motion.button
                        key={wIndex}
                        className="w-full text-left p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                        onClick={() => {
                          setSelectedWorkout(workout)
                          setIsModalOpen(true)
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white truncate">
                              {workout.title}
                            </div>
                            {workout.duration > 0 && (
                              <div className="text-xs text-[var(--text-muted)]">
                                {workout.duration} min
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
                    Total:{" "}
                    {daySchedule.workouts.reduce((sum, w) => sum + w.duration, 0)} min
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
              const colors: Record<string, string> = {
                swim: "var(--swim-blue)",
                bike: "var(--bike-orange)",
                run: "var(--run-green)",
                lift_upper: "var(--lift-purple)",
                lift_lower: "var(--lift-purple)",
                brick: "#ff6b35",
                rest: "var(--text-muted)",
                mobility: "#14b8a6",
              }
              const color = colors[type]
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
        onComplete={() => setIsModalOpen(false)}
        onAddToCalendar={() => {
          // TODO: Add to calendar
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
