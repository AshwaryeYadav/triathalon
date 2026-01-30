"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Waves,
  Bike,
  Footprints,
  Dumbbell,
  Flame,
  Filter,
  Search,
} from "lucide-react"
import { WorkoutCard, WorkoutModal } from "@/components"
import {
  upperBodyWorkout,
  lowerBodyWorkout,
  weeklySchedulePhase1,
  weeklySchedulePhase2,
  type WorkoutTemplate,
} from "@/lib/training-plan"

type FilterType = "all" | "swim" | "bike" | "run" | "lift" | "brick"

export default function WorkoutsPage() {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Collect all unique workouts
  const allWorkouts: WorkoutTemplate[] = [
    upperBodyWorkout,
    lowerBodyWorkout,
    ...weeklySchedulePhase1.flatMap((d) => d.workouts),
    ...weeklySchedulePhase2.flatMap((d) => d.workouts),
  ]

  // Remove duplicates by title
  const uniqueWorkouts = allWorkouts.reduce((acc, workout) => {
    if (!acc.find((w) => w.title === workout.title)) {
      acc.push(workout)
    }
    return acc
  }, [] as WorkoutTemplate[])

  // Filter workouts
  const filteredWorkouts = uniqueWorkouts.filter((workout) => {
    // Filter by type
    if (filter !== "all") {
      if (filter === "lift") {
        if (!workout.type.startsWith("lift")) return false
      } else if (workout.type !== filter) {
        return false
      }
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        workout.title.toLowerCase().includes(query) ||
        workout.description?.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Group by type
  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
    const type = workout.type.startsWith("lift") ? "lift" : workout.type
    if (!acc[type]) acc[type] = []
    acc[type].push(workout)
    return acc
  }, {} as Record<string, WorkoutTemplate[]>)

  const filterButtons: { type: FilterType; label: string; icon: typeof Waves; color: string }[] = [
    { type: "all", label: "All", icon: Filter, color: "var(--text-secondary)" },
    { type: "swim", label: "Swim", icon: Waves, color: "var(--swim-blue)" },
    { type: "bike", label: "Bike", icon: Bike, color: "var(--bike-orange)" },
    { type: "run", label: "Run", icon: Footprints, color: "var(--run-green)" },
    { type: "lift", label: "Lift", icon: Dumbbell, color: "var(--lift-purple)" },
    { type: "brick", label: "Brick", icon: Flame, color: "#ff6b35" },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Workout Library</h1>
          <p className="text-[var(--text-secondary)]">
            Browse all workouts in your training plan
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--swim-blue)] transition-colors"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {filterButtons.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all
                  ${
                    filter === type
                      ? "bg-[var(--bg-tertiary)]"
                      : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                  }
                `}
                style={{
                  boxShadow: filter === type ? `0 0 0 2px ${color}` : "none",
                }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: filter === type ? "white" : "var(--text-secondary)" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Workouts Grid */}
        {Object.entries(groupedWorkouts).map(([type, workouts], groupIndex) => (
          <motion.div
            key={type}
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <h2 className="text-lg font-semibold text-white mb-4 capitalize">
              {type === "lift" ? "Strength Training" : type} Workouts
              <span className="text-sm font-normal text-[var(--text-muted)] ml-2">
                ({workouts.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map((workout, index) => (
                <WorkoutCard
                  key={workout.title}
                  workout={workout}
                  delay={index}
                  onClick={() => {
                    setSelectedWorkout(workout)
                    setIsModalOpen(true)
                  }}
                />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Empty State */}
        {Object.keys(groupedWorkouts).length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
            <h3 className="text-lg font-medium text-white mb-2">No workouts found</h3>
            <p className="text-[var(--text-secondary)]">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </div>

      {/* Workout Modal */}
      <WorkoutModal
        workout={selectedWorkout}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => setIsModalOpen(false)}
      />
    </div>
  )
}
