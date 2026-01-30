"use client"

import { motion } from "framer-motion"
import {
  User,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Footprints,
  Waves,
  Bike,
  Dumbbell,
  Heart,
} from "lucide-react"

export default function ProfilePage() {
  // Mock user data
  const user = {
    name: "Triathlete",
    email: "athlete@example.com",
    height: 74, // 6'2"
    weight: 205,
    raceDate: new Date("2026-04-11"),
    injuryNotes: "Lisfranc injury - limit running volume",
    joinedDate: new Date("2026-01-30"),
  }

  // Calculate stats
  const today = new Date()
  const daysUntilRace = Math.ceil(
    (user.raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  const weeksTraining = Math.floor(
    (today.getTime() - user.joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )

  const stats = {
    workoutsCompleted: 12,
    totalHours: 8.5,
    avgRecovery: 72,
    currentStreak: 7,
  }

  const disciplines = [
    {
      name: "Swim",
      icon: Waves,
      color: "var(--swim-blue)",
      distance: "4,200m",
      time: "1h 45m",
    },
    {
      name: "Bike",
      icon: Bike,
      color: "var(--bike-orange)",
      distance: "48 mi",
      time: "3h 20m",
    },
    {
      name: "Run",
      icon: Footprints,
      color: "var(--run-green)",
      distance: "8.2 mi",
      time: "1h 15m",
    },
    {
      name: "Strength",
      icon: Dumbbell,
      color: "var(--lift-purple)",
      sessions: "6",
      time: "4h 30m",
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="glass-card p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--swim-blue)] via-[var(--bike-orange)] to-[var(--run-green)] flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white mb-1">
                {user.name}
              </h1>
              <p className="text-[var(--text-secondary)]">{user.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm">
                <span className="text-[var(--text-muted)]">
                  📏 {Math.floor(user.height / 12)}&apos;{user.height % 12}&quot;
                </span>
                <span className="text-[var(--text-muted)]">
                  ⚖️ {user.weight} lbs
                </span>
                <span className="text-[var(--text-muted)]">
                  🏁 Race: April 11, 2026
                </span>
              </div>
            </div>

            {/* Days until race */}
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--swim-blue)]">
                {daysUntilRace}
              </div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                Days to Race
              </div>
            </div>
          </div>

          {/* Injury note */}
          {user.injuryNotes && (
            <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">
                    Training Note
                  </p>
                  <p className="text-xs text-yellow-400/70 mt-1">
                    {user.injuryNotes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Target}
            value={stats.workoutsCompleted}
            label="Workouts"
            color="var(--swim-blue)"
            delay={0}
          />
          <StatCard
            icon={TrendingUp}
            value={`${stats.totalHours}h`}
            label="Training Time"
            color="var(--bike-orange)"
            delay={1}
          />
          <StatCard
            icon={Heart}
            value={`${stats.avgRecovery}%`}
            label="Avg Recovery"
            color="var(--run-green)"
            delay={2}
          />
          <StatCard
            icon={Award}
            value={stats.currentStreak}
            label="Day Streak"
            color="var(--lift-purple)"
            delay={3}
          />
        </div>

        {/* Discipline Breakdown */}
        <motion.div
          className="glass-card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Training by Discipline
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {disciplines.map((discipline, index) => (
              <motion.div
                key={discipline.name}
                className="bg-[var(--bg-tertiary)] rounded-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div
                  className="p-2 rounded-lg inline-block mb-3"
                  style={{ backgroundColor: `${discipline.color}20` }}
                >
                  <discipline.icon
                    className="w-5 h-5"
                    style={{ color: discipline.color }}
                  />
                </div>
                <h3 className="font-medium text-white mb-2">{discipline.name}</h3>
                <div className="text-xs text-[var(--text-muted)]">
                  {discipline.distance || `${discipline.sessions} sessions`}
                </div>
                <div className="text-sm font-medium text-white mt-1">
                  {discipline.time}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            Race Goals
          </h2>
          <div className="space-y-4">
            <GoalItem
              icon={Waves}
              title="Swim 750m"
              description="Complete the swim with confident, efficient strokes"
              color="var(--swim-blue)"
            />
            <GoalItem
              icon={Bike}
              title="Bike 12.4 miles"
              description="Strong and steady on the bike, build for the run"
              color="var(--bike-orange)"
            />
            <GoalItem
              icon={Footprints}
              title="Run 5K"
              description="Finish strong despite the brick legs. Protect the foot!"
              color="var(--run-green)"
            />
            <GoalItem
              icon={Award}
              title="Cross the Finish Line"
              description="Complete your first sprint triathlon healthy and proud"
              color="var(--lift-purple)"
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  delay,
}: {
  icon: typeof Target
  value: string | number
  label: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <div
        className="p-2 rounded-lg inline-block mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
        {label}
      </div>
    </motion.div>
  )
}

function GoalItem({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: typeof Waves
  title: string
  description: string
  color: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[var(--bg-tertiary)] rounded-xl">
      <div
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
      </div>
    </div>
  )
}
