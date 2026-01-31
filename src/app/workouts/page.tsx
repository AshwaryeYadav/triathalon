"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Waves,
  Bike,
  Footprints,
  Dumbbell,
  Flame,
  Moon,
  Sparkles,
  Plus,
  Filter,
  Search,
  TrendingUp,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from "lucide-react"
import { WorkoutCard, WorkoutModal } from "@/components"
import {
  getPhaseByWeek,
  getScheduleByPhase,
  getRecoveryAdjustment,
  type WorkoutTemplate,
  type WorkoutType,
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

const workoutTypes: { type: WorkoutType | "all"; label: string; icon: typeof Waves; color: string }[] = [
  { type: "all", label: "All", icon: Filter, color: "#ffffff" },
  { type: "swim", label: "Swim", icon: Waves, color: "var(--swim-blue)" },
  { type: "bike", label: "Bike", icon: Bike, color: "var(--bike-orange)" },
  { type: "run", label: "Run", icon: Footprints, color: "var(--run-green)" },
  { type: "lift_upper", label: "Lift", icon: Dumbbell, color: "var(--lift-purple)" },
  { type: "brick", label: "Brick", icon: Flame, color: "#ff6b35" },
  { type: "mobility", label: "Mobility", icon: Sparkles, color: "#14b8a6" },
]

interface CustomWorkout {
  id: string
  title: string
  type: WorkoutType
  duration: number
  intensity: "easy" | "moderate" | "hard" | "race_pace"
  description: string
  date: string
  completed: boolean
}

export default function WorkoutsPage() {
  const [filter, setFilter] = useState<WorkoutType | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set())
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate current week
  const startDate = new Date("2026-01-30")
  const today = new Date()
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const currentWeek = Math.min(Math.max(Math.floor(daysSinceStart / 7) + 1, 1), 10)
  const currentPhase = getPhaseByWeek(currentWeek)
  const schedule = getScheduleByPhase(currentPhase.name)

  // Get recovery adjustment
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
    // Load custom workouts and completed from localStorage
    const saved = localStorage.getItem("customWorkouts")
    if (saved) setCustomWorkouts(JSON.parse(saved))
    const completed = localStorage.getItem("completedWorkouts")
    if (completed) setCompletedWorkouts(new Set(JSON.parse(completed)))
  }, [fetchWhoopData])

  // Get all planned workouts this week
  const allPlannedWorkouts: WorkoutTemplate[] = schedule.flatMap((day) => day.workouts)

  // Combine with custom workouts
  const customAsTemplates: WorkoutTemplate[] = customWorkouts.map((w) => ({
    title: w.title,
    type: w.type,
    duration: w.duration,
    intensity: w.intensity,
    description: w.description,
  }))

  const allWorkouts = [...allPlannedWorkouts, ...customAsTemplates]

  // Filter workouts
  const filteredWorkouts = allWorkouts.filter((workout) => {
    const matchesType = filter === "all" || workout.type === filter || 
      (filter === "lift_upper" && (workout.type === "lift_upper" || workout.type === "lift_lower"))
    const matchesSearch = workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  // Adjust workout based on recovery
  const getAdjustedWorkout = (workout: WorkoutTemplate): WorkoutTemplate => {
    if (recoveryScore >= 67) return workout

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

  const handleAddWorkout = (workout: CustomWorkout) => {
    const newWorkouts = [...customWorkouts, workout]
    setCustomWorkouts(newWorkouts)
    localStorage.setItem("customWorkouts", JSON.stringify(newWorkouts))
    setShowAddModal(false)
  }

  const handleDeleteCustomWorkout = (id: string) => {
    const newWorkouts = customWorkouts.filter(w => w.id !== id)
    setCustomWorkouts(newWorkouts)
    localStorage.setItem("customWorkouts", JSON.stringify(newWorkouts))
  }

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
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Workouts</h1>
              <p className="text-[var(--text-secondary)]">
                Week {currentWeek} • {currentPhase.description} Phase
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Workout
            </button>
          </div>
        </motion.div>

        {/* Recovery Status Banner */}
        {recoveryScore < 67 && whoopData && (
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
                  Workouts are automatically adjusted: {Math.round(recoveryAdjustment.adjustments.volumeModifier * 100)}% volume
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-white">
              {completedWorkouts.size}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Completed This Week</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-[var(--swim-blue)]">
              {allPlannedWorkouts.length}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Planned Workouts</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-[var(--bike-orange)]">
              {whoopData?.strain.dayStrain.toFixed(1) || "0.0"}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Today's Strain</div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-5 h-5 ${
                recoveryScore >= 67 ? "text-green-400" : 
                recoveryScore >= 34 ? "text-yellow-400" : "text-red-400"
              }`} />
              <span className="text-2xl font-bold text-white">{recoveryScore}%</span>
            </div>
            <div className="text-xs text-[var(--text-muted)]">Recovery</div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="mb-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--swim-blue)] transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {workoutTypes.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${filter === type
                    ? "text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                  }
                `}
                style={filter === type ? {
                  backgroundColor: `${color}20`,
                  boxShadow: `0 0 0 2px ${color}`,
                } : {}}
              >
                <Icon className="w-4 h-4" style={{ color: filter === type ? color : undefined }} />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Workouts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredWorkouts.map((workout, index) => {
              const adjustedWorkout = getAdjustedWorkout(workout)
              const isCompleted = completedWorkouts.has(workout.title)
              const isCustom = customWorkouts.some(w => w.title === workout.title)

              return (
                <motion.div
                  key={`${workout.title}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <WorkoutCard
                    workout={adjustedWorkout}
                    status={isCompleted ? "completed" : "scheduled"}
                    recoveryAdjusted={recoveryScore < 67 && workout.type !== "rest" && workout.type !== "mobility"}
                    onClick={() => {
                      setSelectedWorkout(adjustedWorkout)
                      setIsModalOpen(true)
                    }}
                    delay={index}
                  />
                  {isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const customW = customWorkouts.find(w => w.title === workout.title)
                        if (customW) handleDeleteCustomWorkout(customW.id)
                      }}
                      className="absolute top-2 right-12 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredWorkouts.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Moon className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)]">
              No workouts found matching your criteria
            </p>
          </motion.div>
        )}
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
        recoveryScore={recoveryScore}
        adjustedWorkout={selectedWorkout && recoveryScore < 67 ? getAdjustedWorkout(selectedWorkout) : undefined}
      />

      {/* Add Workout Modal */}
      <AddWorkoutModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddWorkout}
      />
    </div>
  )
}

function AddWorkoutModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean
  onClose: () => void
  onAdd: (workout: CustomWorkout) => void
}) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<WorkoutType>("run")
  const [duration, setDuration] = useState(30)
  const [intensity, setIntensity] = useState<"easy" | "moderate" | "hard" | "race_pace">("moderate")
  const [description, setDescription] = useState("")

  const handleSubmit = () => {
    if (!title.trim()) return

    onAdd({
      id: crypto.randomUUID(),
      title,
      type,
      duration,
      intensity,
      description: description || `Custom ${type} workout`,
      date: new Date().toISOString(),
      completed: false,
    })

    // Reset form
    setTitle("")
    setType("run")
    setDuration(30)
    setIntensity("moderate")
    setDescription("")
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card p-6 w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-white mb-6">Add Custom Workout</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Workout Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Run"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WorkoutType)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
              >
                <option value="swim">🏊 Swim</option>
                <option value="bike">🚴 Bike</option>
                <option value="run">🏃 Run</option>
                <option value="lift_upper">🏋️ Upper Body</option>
                <option value="lift_lower">🦵 Lower Body</option>
                <option value="brick">🔥 Brick</option>
                <option value="mobility">🧘 Mobility</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={5}
                  max={180}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">
                  Intensity
                </label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as "easy" | "moderate" | "hard" | "race_pace")}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                  <option value="race_pace">Race Pace</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes about this workout..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Add Workout
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
