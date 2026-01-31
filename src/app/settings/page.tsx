"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Calendar,
  Activity,
  User,
  Save,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  AlertCircle,
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

  const [whoopConnected, setWhoopConnected] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Check connection status on load
  useEffect(() => {
    checkConnections()
  }, [])

  const checkConnections = async () => {
    try {
      const whoopRes = await fetch("/api/whoop")
      const whoopData = await whoopRes.json()
      setWhoopConnected(whoopData.connected && !whoopData.demo)
    } catch {
      setWhoopConnected(false)
    }

    // Google connection is determined by session
    // For now, assume connected if we have the scope
    setGoogleConnected(false) // Will be updated when user signs in with Google
  }

  const syncCalendar = async () => {
    setIsSyncing(true)
    setSyncMessage(null)

    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week: 1 }),
      })

      const data = await res.json()

      if (res.ok) {
        setSyncMessage(`✅ ${data.message}`)
      } else {
        setSyncMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setSyncMessage("❌ Failed to sync calendar")
    } finally {
      setIsSyncing(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    // TODO: Save to database
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const connectWhoop = async () => {
    try {
      const res = await fetch("/api/whoop/connect")
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error("Failed to connect Whoop:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-[var(--text-secondary)]">
            Manage your training preferences and integrations
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

          <div className="space-y-4">
            {/* Whoop Integration */}
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">WHOOP</div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Sync recovery and strain data
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {whoopConnected ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={connectWhoop}
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Google Calendar Integration */}
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4285f4] to-[#34a853] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Google Calendar</div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Sync workouts to your calendar
                    </div>
                  </div>
                </div>
                <button
                  onClick={syncCalendar}
                  disabled={isSyncing}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  Sync Week
                </button>
              </div>

              {syncMessage && (
                <div
                  className={`text-sm p-3 rounded-lg ${
                    syncMessage.startsWith("✅")
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {syncMessage}
                </div>
              )}

              <div className="mt-4 text-xs text-[var(--text-muted)]">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Sign in with Google to enable calendar sync. Add GOOGLE_CLIENT_ID and
                GOOGLE_CLIENT_SECRET to your environment variables.
              </div>
            </div>
          </div>
        </motion.div>

        {/* API Setup Instructions */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            🔧 Setup Instructions
          </h2>
          <div className="space-y-4 text-sm text-[var(--text-secondary)]">
            <div>
              <h3 className="font-medium text-white mb-2">Whoop Integration</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <a href="https://developer.whoop.com" target="_blank" rel="noopener noreferrer" className="text-[var(--swim-blue)] underline">developer.whoop.com</a></li>
                <li>Create a new application</li>
                <li>Set redirect URI to: <code className="bg-[var(--bg-tertiary)] px-1 rounded">https://your-domain.com/api/whoop/callback</code></li>
                <li>Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET to Vercel environment variables</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Google Calendar</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--swim-blue)] underline">Google Cloud Console</a></li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Enable Google Calendar API</li>
                <li>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          onClick={saveSettings}
          disabled={isSaving}
          className="btn-primary w-full flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
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
