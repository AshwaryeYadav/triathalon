"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Calendar,
  Activity,
  User,
  Moon,
  Sun,
  Save,
  ChevronRight,
} from "lucide-react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    recoveryAlerts: true,
    weeklySummary: true,
    pushEnabled: false,
  })

  const [profile, setProfile] = useState({
    height: 74,
    weight: 205,
    raceDate: "2026-04-11",
  })

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-[var(--text-secondary)]">
            Manage your training preferences
          </p>
        </div>

        {/* Profile Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[var(--swim-blue)]" />
            <h2 className="text-lg font-semibold text-white">Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">
                  Height (inches)
                </label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(e) =>
                    setProfile({ ...profile, height: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(e) =>
                    setProfile({ ...profile, weight: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Race Date
              </label>
              <input
                type="date"
                value={profile.raceDate}
                onChange={(e) =>
                  setProfile({ ...profile, raceDate: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
              />
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-[var(--bike-orange)]" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              label="Workout Reminders"
              description="Get notified before scheduled workouts"
              enabled={notifications.workoutReminders}
              onChange={(v) =>
                setNotifications({ ...notifications, workoutReminders: v })
              }
            />
            <ToggleSetting
              label="Recovery Alerts"
              description="Alerts when recovery score affects your workout"
              enabled={notifications.recoveryAlerts}
              onChange={(v) =>
                setNotifications({ ...notifications, recoveryAlerts: v })
              }
            />
            <ToggleSetting
              label="Weekly Summary"
              description="Receive a weekly training summary"
              enabled={notifications.weeklySummary}
              onChange={(v) =>
                setNotifications({ ...notifications, weeklySummary: v })
              }
            />
            <ToggleSetting
              label="Push Notifications"
              description="Enable browser push notifications"
              enabled={notifications.pushEnabled}
              onChange={(v) =>
                setNotifications({ ...notifications, pushEnabled: v })
              }
            />
          </div>
        </motion.div>

        {/* Integrations Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-[var(--run-green)]" />
            <h2 className="text-lg font-semibold text-white">Integrations</h2>
          </div>

          <div className="space-y-3">
            <IntegrationLink
              name="WHOOP"
              description="Sync recovery and strain data"
              connected={true}
              href="/whoop"
            />
            <IntegrationLink
              name="Google Calendar"
              description="Sync workouts to your calendar"
              connected={false}
              href="/api/auth/google"
            />
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          className="btn-primary w-full flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Save className="w-4 h-4" />
          Save Changes
        </motion.button>
      </div>
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
      <div>
        <div className="font-medium text-white">{label}</div>
        <div className="text-sm text-[var(--text-muted)]">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative w-12 h-6 rounded-full transition-colors
          ${enabled ? "bg-[var(--swim-blue)]" : "bg-[var(--border-subtle)]"}
        `}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white"
          animate={{ left: enabled ? 28 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

function IntegrationLink({
  name,
  description,
  connected,
  href,
}: {
  name: string
  description: string
  connected: boolean
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)] transition-colors"
    >
      <div>
        <div className="font-medium text-white">{name}</div>
        <div className="text-sm text-[var(--text-muted)]">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            connected
              ? "bg-green-500/10 text-green-400"
              : "bg-[var(--border-subtle)] text-[var(--text-muted)]"
          }`}
        >
          {connected ? "Connected" : "Connect"}
        </span>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
    </a>
  )
}
