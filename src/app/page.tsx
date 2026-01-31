"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Heart,
  Zap,
  Moon,
  TrendingUp,
  RefreshCw,
  Target,
  Calendar,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import {
  RecoveryRing,
  WorkoutCard,
  WeeklyCalendar,
  StatsCard,
  PhaseProgress,
  WorkoutModal,
} from "@/components"
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
  lastUpdated: string
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set())
  const [showAddWorkout, setShowAddWorkout] = useState(false)

  // Calculate current week (from Jan 30, 2026 to April 11, 2026 = ~10 weeks)
  const raceDate = new Date("2026-04-11")
  const startDate = new Date("2026-01-30")
  const today = new Date()
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const currentWeek = Math.min(Math.max(Math.floor(daysSinceStart / 7) + 1, 1), 10)

  // Get current phase and schedule
  const currentPhase = getPhaseByWeek(currentWeek)
  const schedule = getScheduleByPhase(currentPhase.name)

  // Get today's workouts
  const dayOfWeek = (today.getDay() + 6) % 7 // Convert Sunday = 0 to Monday = 0
  const todaySchedule = schedule.find((d) => d.dayOfWeek === dayOfWeek)

  // Get recovery adjustment based on Whoop data
  const recoveryScore = whoopData?.recovery.score || 70
  const recoveryAdjustment = getRecoveryAdjustment(recoveryScore)

  // Fetch Whoop data
  const fetchWhoopData = useCallback(async () => {
    try {
      const res = await fetch("/api/whoop")
      const data = await res.json()

      if (data.data) {
        setWhoopData(data.data)
        setIsConnected(data.connected && !data.demo)
      }
    } catch (error) {
      console.error("Failed to fetch Whoop data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWhoopData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchWhoopData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWhoopData])

  const refreshWhoopData = async () => {
    setIsRefreshing(true)
    await fetchWhoopData()
    setIsRefreshing(false)
  }

  // Adjust workout based on recovery
  const getAdjustedWorkout = (workout: WorkoutTemplate): WorkoutTemplate => {
    if (recoveryScore >= 67) return workout // Good recovery, no adjustment

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

  const handleWorkoutClick = (workout: WorkoutTemplate) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

  const handleCompleteWorkout = (workoutTitle: string) => {
    setCompletedWorkouts(prev => new Set([...prev, workoutTitle]))
    setIsModalOpen(false)
  }

  const handleSkipWorkout = (workoutTitle: string) => {
    // Could track skipped workouts separately
    setIsModalOpen(false)
  }

  // Calculate stats based on real data
  const weeklyWorkoutsCompleted = completedWorkouts.size
  const weeklyWorkoutsPlanned = schedule.reduce((acc, day) => acc + day.workouts.length, 0)
  const strainTarget = recoveryScore >= 67 ? 14 : recoveryScore >= 34 ? 10 : 6
  const currentStrain = whoopData?.strain.dayStrain || 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--swim-blue)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading your training data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-primary)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Greeting */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {getGreeting()}, Triathlete 🏊‍♂️🚴🏃
          </h1>
                <p className="text-[var(--text-secondary)]">
                  Week {currentWeek} • {currentPhase.description} Phase
                  {isConnected && (
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Whoop Connected
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={refreshWhoopData}
                disabled={isRefreshing}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Sync
              </button>
            </div>
          </motion.div>

          {/* Recovery Alert Banner */}
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
                    {recoveryAdjustment.adjustments.recommendation}
                  </p>
                  <p className={`text-xs mt-1 ${
                    recoveryScore < 34 ? "text-red-400/70" : "text-yellow-400/70"
                  }`}>
                    Today's workouts have been adjusted: {Math.round(recoveryAdjustment.adjustments.volumeModifier * 100)}% volume, {Math.round(recoveryAdjustment.adjustments.intensityModifier * 100)}% intensity
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Recovery & Today's Focus */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recovery & Strain Card */}
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Recovery Ring */}
                  <div className="flex-shrink-0">
                    <RecoveryRing score={recoveryScore} />
                  </div>

                  {/* Stats Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-[var(--text-muted)] uppercase">
                          HRV
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {whoopData?.recovery.hrv || 0}
                        <span className="text-sm text-[var(--text-muted)] ml-1">ms</span>
                      </div>
                    </div>
                    <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="text-xs text-[var(--text-muted)] uppercase">
                          Resting HR
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {whoopData?.recovery.restingHR || 0}
                        <span className="text-sm text-[var(--text-muted)] ml-1">bpm</span>
                      </div>
                    </div>
                    <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-[var(--text-muted)] uppercase">
                          Day Strain
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {currentStrain.toFixed(1)}
                        <span className="text-sm text-[var(--text-muted)] ml-1">/ {strainTarget}</span>
                      </div>
                      <div className="progress-bar mt-2">
                        <div
                          className="progress-fill bg-[var(--bike-orange)]"
                          style={{ width: `${Math.min((currentStrain / strainTarget) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Moon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-[var(--text-muted)] uppercase">
                          Sleep
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {whoopData?.sleep.duration ? `${Math.floor(whoopData.sleep.duration / 60)}h ${whoopData.sleep.duration % 60}m` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strain recommendation */}
                <div className="mt-4 p-4 rounded-xl bg-[var(--bg-tertiary)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-medium">
                        {currentStrain < strainTarget * 0.5
                          ? "🎯 You have room for more strain today"
                          : currentStrain < strainTarget
                          ? "💪 On track for your strain target"
                          : "⚡ Great work! Consider recovery activities"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Based on your recovery score of {recoveryScore}%
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[var(--bike-orange)]">
                        {whoopData?.strain.calories.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">calories burned</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Today's Workouts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Today's Training</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {todaySchedule?.dayName || "Today"}
                    </span>
                    <button
                      onClick={() => setShowAddWorkout(true)}
                      className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[var(--swim-blue)]" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-4">
                  {todaySchedule?.workouts.map((workout, index) => {
                    const adjustedWorkout = getAdjustedWorkout(workout)
                    const isCompleted = completedWorkouts.has(workout.title)

                    return (
                      <WorkoutCard
                        key={index}
                        workout={adjustedWorkout}
                        delay={index}
                        recoveryAdjusted={recoveryScore < 67}
                        status={isCompleted ? "completed" : "scheduled"}
                        onClick={() => handleWorkoutClick(adjustedWorkout)}
                      />
                    )
                  })}
                  {(!todaySchedule || todaySchedule.workouts.length === 0) && (
                    <div className="glass-card p-8 text-center">
                      <Moon className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                      <h3 className="text-lg font-medium text-white mb-2">Rest Day</h3>
                      <p className="text-[var(--text-secondary)]">
                        Recovery is just as important as training. Take it easy today!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Phase Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PhaseProgress currentWeek={currentWeek} raceDate={raceDate} />
              </motion.div>
            </div>

            {/* Right Column - Calendar & Stats */}
            <div className="space-y-6">
              {/* Weekly Calendar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h2 className="text-xl font-bold text-white mb-4">This Week</h2>
                <WeeklyCalendar
                  schedule={schedule}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-4"
              >
                <StatsCard
                  title="Weekly Workouts"
                  value={weeklyWorkoutsCompleted}
                  subtitle={`of ${weeklyWorkoutsPlanned} planned`}
                  icon={Target}
                  color="var(--swim-blue)"
                  delay={1}
                />
                <StatsCard
                  title="Avg Heart Rate"
                  value={whoopData?.strain.averageHR || "—"}
                  subtitle="bpm today"
                  icon={Heart}
                  color="var(--bike-orange)"
                  delay={2}
                />
                <StatsCard
                  title="Sleep Efficiency"
                  value={whoopData?.sleep.efficiency ? `${whoopData.sleep.efficiency}%` : "—"}
                  subtitle="last night"
                  icon={Moon}
                  color="var(--run-green)"
                  delay={3}
                />
              </motion.div>

              {/* Quick Links */}
              <motion.div
                className="glass-card p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <QuickLink
                    label="View Full Schedule"
                    icon={Calendar}
                    href="/schedule"
                  />
                  <QuickLink
                    label="Whoop Dashboard"
                    icon={Heart}
                    href="/whoop"
                  />
                  <QuickLink
                    label="Sync to Calendar"
                    icon={TrendingUp}
                    href="/settings"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Workout Modal */}
      <WorkoutModal
        workout={selectedWorkout}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => {
          if (selectedWorkout) {
            handleCompleteWorkout(selectedWorkout.title)
          }
        }}
        onSkip={() => {
          if (selectedWorkout) {
            handleSkipWorkout(selectedWorkout.title)
          }
        }}
        recoveryScore={recoveryScore}
        adjustedWorkout={selectedWorkout && recoveryScore < 67 ? getAdjustedWorkout(selectedWorkout) : undefined}
      />

      {/* Add Workout Modal */}
      {showAddWorkout && (
        <AddWorkoutModal
          onClose={() => setShowAddWorkout(false)}
          onAdd={(workout) => {
            // In a real app, this would save to the database
            console.log("Adding workout:", workout)
            setShowAddWorkout(false)
          }}
        />
      )}
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function QuickLink({
  label,
  icon: Icon,
  href,
}: {
  label: string
  icon: typeof Heart
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between w-full p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-[var(--swim-blue)]" />
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
    </a>
  )
}

function AddWorkoutModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (workout: { title: string; type: string; duration: number }) => void
}) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState("run")
  const [duration, setDuration] = useState(30)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="glass-card p-6 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Add Custom Workout</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">
              Workout Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Easy Run"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white"
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

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={5}
              max={180}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => onAdd({ title, type, duration })}
            disabled={!title}
            className="btn-primary flex-1"
          >
            Add Workout
          </button>
        </div>
      </motion.div>
    </div>
  )
}
