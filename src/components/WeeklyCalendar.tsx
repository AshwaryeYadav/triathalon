"use client"

import { motion } from "framer-motion"
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns"
import { Waves, Bike, Footprints, Dumbbell, Flame, Moon, Sparkles } from "lucide-react"
import type { DaySchedule } from "@/lib/training-plan"

interface WeeklyCalendarProps {
  schedule: DaySchedule[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  weekStart?: Date
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

const workoutTypeColors: Record<string, string> = {
  swim: "var(--swim-blue)",
  bike: "var(--bike-orange)",
  run: "var(--run-green)",
  lift_upper: "var(--lift-purple)",
  lift_lower: "var(--lift-purple)",
  brick: "#ff6b35",
  rest: "var(--text-muted)",
  mobility: "#14b8a6",
}

export function WeeklyCalendar({
  schedule,
  selectedDate,
  onSelectDate,
  weekStart,
}: WeeklyCalendarProps) {
  const start = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 })

  return (
    <div className="glass-card p-4">
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-[var(--text-muted)] pb-2"
          >
            {day}
          </div>
        ))}

        {/* Days */}
        {schedule.map((daySchedule, index) => {
          const date = addDays(start, index)
          const isSelected = isSameDay(date, selectedDate)
          const isCurrentDay = isToday(date)
          const workoutTypes = daySchedule.workouts.map((w) => w.type)

          return (
            <motion.button
              key={daySchedule.dayOfWeek}
              className={`
                relative p-2 rounded-xl transition-all
                ${isSelected ? "bg-[var(--bg-tertiary)] ring-2 ring-[var(--swim-blue)]" : ""}
                ${isCurrentDay && !isSelected ? "bg-[var(--bg-tertiary)]" : ""}
                hover:bg-[var(--bg-tertiary)]
              `}
              onClick={() => onSelectDate(date)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Date number */}
              <div
                className={`
                  text-lg font-semibold mb-2
                  ${isCurrentDay ? "text-[var(--swim-blue)]" : "text-white"}
                `}
              >
                {format(date, "d")}
              </div>

              {/* Workout type indicators */}
              <div className="flex flex-wrap justify-center gap-1">
                {workoutTypes.slice(0, 3).map((type, i) => {
                  const Icon = workoutTypeIcons[type] || Dumbbell
                  const color = workoutTypeColors[type]
                  return (
                    <div
                      key={i}
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="w-3 h-3" style={{ color }} />
                    </div>
                  )
                })}
              </div>

              {/* Today indicator */}
              {isCurrentDay && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--swim-blue)]" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
