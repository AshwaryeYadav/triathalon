"use client"

import { useState, useEffect } from "react"
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
  type DaySchedule,
} from "@/lib/training-plan"
import { getMockWhoopData } from "@/lib/whoop"

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [whoopData, setWhoopData] = useState(getMockWhoopData())
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  // Get recovery adjustment
  const recoveryAdjustment = getRecoveryAdjustment(whoopData.recovery.score)

  // Simulate Whoop data refresh
  const refreshWhoopData = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setWhoopData(getMockWhoopData())
      setIsRefreshing(false)
    }, 1500)
  }

  const handleWorkoutClick = (workout: WorkoutTemplate) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {getGreeting()}, Triathlete 🏊‍♂️🚴🏃
          </h1>
            <p className="text-[var(--text-secondary)]">
              Week {currentWeek} • {currentPhase.description} Phase
            </p>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Recovery & Today's Focus */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recovery Card */}
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Recovery Ring */}
                  <div className="flex-shrink-0">
                    <RecoveryRing score={whoopData.recovery.score} />
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
                        {whoopData.recovery.hrv}
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
                        {whoopData.recovery.restingHR}
                        <span className="text-sm text-[var(--text-muted)] ml-1">bpm</span>
                      </div>
                    </div>
                    <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-[var(--text-muted)] uppercase">
                          Strain
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {whoopData.strain.dayStrain.toFixed(1)}
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
                        {Math.floor(whoopData.sleep.duration / 60)}h{" "}
                        {whoopData.sleep.duration % 60}m
                      </div>
                    </div>
                  </div>

                  {/* Refresh button */}
                  <button
                    onClick={refreshWhoopData}
                    disabled={isRefreshing}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-[var(--text-muted)] ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Recovery recommendation */}
                <div className="mt-4 p-4 rounded-xl bg-[var(--bg-tertiary)]">
                  <p className="text-sm">{recoveryAdjustment.adjustments.recommendation}</p>
                </div>
              </motion.div>

              {/* Today's Workouts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Today&apos;s Training</h2>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {todaySchedule?.dayName || "Today"}
                  </span>
                </div>
                <div className="grid gap-4">
                  {todaySchedule?.workouts.map((workout, index) => (
                    <WorkoutCard
                      key={index}
                      workout={workout}
                      delay={index}
                      recoveryAdjusted={whoopData.recovery.score < 67}
                      onClick={() => handleWorkoutClick(workout)}
                    />
                  ))}
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
                  value="5"
                  subtitle="of 6 planned"
                  icon={Target}
                  color="var(--swim-blue)"
                  delay={1}
                />
                <StatsCard
                  title="Training Hours"
                  value="4.5"
                  subtitle="hrs this week"
                  icon={TrendingUp}
                  color="var(--bike-orange)"
                  trend={{ value: 12, label: "vs last week" }}
                  delay={2}
                />
                <StatsCard
                  title="Streak"
                  value="7"
                  subtitle="days consistent"
                  icon={Zap}
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
                    label="Sync with Google Calendar"
                    icon={Calendar}
                    onClick={() => {}}
                  />
                  <QuickLink
                    label="Connect Whoop"
                    icon={Heart}
                    onClick={() => {}}
                  />
                  <QuickLink
                    label="View Full Schedule"
                    icon={ChevronRight}
                    href="/schedule"
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
          setIsModalOpen(false)
          // TODO: Mark as complete
        }}
        onSkip={() => {
          setIsModalOpen(false)
          // TODO: Mark as skipped
        }}
        recoveryScore={whoopData.recovery.score}
      />
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
  onClick,
  href,
}: {
  label: string
  icon: typeof Heart
  onClick?: () => void
  href?: string
}) {
  const Component = href ? "a" : "button"
  return (
    <Component
      href={href}
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-[var(--swim-blue)]" />
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
    </Component>
  )
}
