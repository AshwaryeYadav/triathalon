"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  Calendar,
  Activity,
  User,
  Save,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  BellRing,
  CalendarPlus,
  Smartphone,
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
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default")
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [weeksToSync, setWeeksToSync] = useState(1)

  // Check connection status on load
  const checkConnections = useCallback(async () => {
    try {
      const whoopRes = await fetch("/api/whoop")
      const whoopData = await whoopRes.json()
      setWhoopConnected(whoopData.connected && !whoopData.demo)
      
      // Check if user is signed in with Google (has calendar access)
      const calendarCheck = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ check: true }),
      }).catch(() => null)
      
      if (calendarCheck?.ok) {
        const data = await calendarCheck.json()
        setGoogleConnected(!data.error?.includes("sign in"))
      }
    } catch {
      setWhoopConnected(false)
    }
  }, [])

  useEffect(() => {
    checkConnections()
    
    // Check push notification permission
    if ("Notification" in window) {
      setPushPermission(Notification.permission)
      // Check if already subscribed
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.pushManager.getSubscription().then((subscription) => {
            setPushSubscribed(!!subscription)
            if (subscription) {
              setNotifications((prev) => ({ ...prev, pushEnabled: true }))
            }
          })
        })
      }
    }
    
    // Load saved settings from localStorage
    const savedProfile = localStorage.getItem("userProfile")
    if (savedProfile) setProfile(JSON.parse(savedProfile))
    const savedNotifications = localStorage.getItem("notificationSettings")
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications))
  }, [checkConnections])

  const enablePushNotifications = async () => {
    try {
      // Request notification permission
      const permission = await Notification.requestPermission()
      setPushPermission(permission)

      if (permission !== "granted") {
        alert("Please enable notifications in your browser settings")
        return
      }

      // Register service worker
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Service Worker registered:", registration)

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
          ),
        })

        // Send subscription to server
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })

        setPushSubscribed(true)
        setNotifications((prev) => ({ ...prev, pushEnabled: true }))
        
        // Show test notification
        new Notification("TriCoach 🏊‍♂️🚴🏃", {
          body: "Push notifications enabled! You'll receive workout reminders.",
          icon: "/favicon.ico",
        })
      }
    } catch (error) {
      console.error("Failed to enable push notifications:", error)
      alert("Failed to enable push notifications. Make sure VAPID keys are configured.")
    }
  }

  const disablePushNotifications = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
      }
      setPushSubscribed(false)
      setNotifications((prev) => ({ ...prev, pushEnabled: false }))
    } catch (error) {
      console.error("Failed to disable push notifications:", error)
    }
  }

  const syncCalendar = async () => {
    setIsSyncing(true)
    setSyncMessage(null)

    try {
      // Sync multiple weeks
      const results = []
      for (let week = 1; week <= weeksToSync; week++) {
        const res = await fetch("/api/calendar/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ week }),
        })

        const data = await res.json()
        
        if (res.ok) {
          results.push({ week, success: true, synced: data.synced })
        } else {
          results.push({ week, success: false, error: data.error })
        }
      }

      const successful = results.filter((r) => r.success)
      const failed = results.filter((r) => !r.success)

      if (failed.length > 0 && failed[0].error) {
        setSyncMessage(`❌ ${failed[0].error}`)
      } else {
        const totalSynced = successful.reduce((sum, r) => sum + (r.synced || 0), 0)
        setSyncMessage(`✅ Synced ${totalSynced} workouts for ${weeksToSync} week(s)!`)
        setGoogleConnected(true)
      }
    } catch (error) {
      setSyncMessage("❌ Failed to sync calendar")
    } finally {
      setIsSyncing(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    // Save to localStorage
    localStorage.setItem("userProfile", JSON.stringify(profile))
    localStorage.setItem("notificationSettings", JSON.stringify(notifications))
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsSaving(false)
  }

  const [whoopError, setWhoopError] = useState<string | null>(null)
  
  const connectWhoop = async () => {
    setWhoopError(null)
    try {
      const res = await fetch("/api/whoop/connect")
      const data = await res.json()
      
      console.log("Whoop connect response:", data)
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else if (data.error) {
        if (data.error === "Unauthorized") {
          setWhoopError("Please sign in first")
        } else if (data.error === "Whoop API not configured") {
          setWhoopError("Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET to Vercel, then redeploy")
        } else {
          setWhoopError(data.error)
        }
      }
    } catch (error) {
      console.error("Failed to connect Whoop:", error)
      setWhoopError("Connection failed")
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

        {/* Push Notifications Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <BellRing className="w-5 h-5 text-[var(--bike-orange)]" />
            <h2 className="text-lg font-semibold text-white">Push Notifications</h2>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931e] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">Browser Notifications</div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Get workout reminders and recovery alerts
                  </div>
                </div>
              </div>
              
              {pushSubscribed ? (
                <button
                  onClick={disablePushNotifications}
                  className="btn-secondary text-sm"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={enablePushNotifications}
                  disabled={pushPermission === "denied"}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Enable
                </button>
              )}
            </div>

            {pushPermission === "denied" && (
              <div className="text-xs p-3 rounded-lg bg-red-500/10 text-red-400">
                ⚠️ Notifications are blocked. Enable them in your browser settings.
              </div>
            )}

            {pushSubscribed && (
              <div className="text-xs p-3 rounded-lg bg-green-500/10 text-green-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Push notifications are enabled! You'll receive workout reminders.
              </div>
            )}
          </div>
        </motion.div>

        {/* Notification Preferences Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-[var(--bike-orange)]" />
            <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              label="Workout Reminders"
              description="30 minutes before scheduled workouts"
              enabled={notifications.workoutReminders}
              onChange={(v) =>
                setNotifications({ ...notifications, workoutReminders: v })
              }
            />
            <ToggleSetting
              label="Recovery Alerts"
              description="When low recovery affects your workout"
              enabled={notifications.recoveryAlerts}
              onChange={(v) =>
                setNotifications({ ...notifications, recoveryAlerts: v })
              }
            />
            <ToggleSetting
              label="Weekly Summary"
              description="Sunday evening training recap"
              enabled={notifications.weeklySummary}
              onChange={(v) =>
                setNotifications({ ...notifications, weeklySummary: v })
              }
            />
          </div>
        </motion.div>

        {/* Google Calendar Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CalendarPlus className="w-5 h-5 text-[var(--run-green)]" />
            <h2 className="text-lg font-semibold text-white">Google Calendar Sync</h2>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4285f4] to-[#34a853] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">Google Calendar</div>
                  <div className="text-sm text-[var(--text-muted)]">
                    {googleConnected ? "Connected" : "Sync workouts to your calendar"}
                  </div>
                </div>
              </div>
              {googleConnected && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
              )}
            </div>

            {/* Weeks selector */}
            <div className="mb-4">
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Weeks to sync ahead
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeeksToSync(w)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      weeksToSync === w
                        ? "bg-[var(--swim-blue)] text-white"
                        : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >
                    {w} week{w > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={syncCalendar}
              disabled={isSyncing}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              Sync {weeksToSync} Week{weeksToSync > 1 ? "s" : ""} to Calendar
            </button>

            {syncMessage && (
              <div
                className={`mt-4 text-sm p-3 rounded-lg ${
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
              Sign in with Google (not demo mode) to enable calendar sync.
            </div>
          </div>
        </motion.div>

        {/* Whoop Integration Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-[var(--swim-blue)]" />
            <h2 className="text-lg font-semibold text-white">WHOOP Integration</h2>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">WHOOP</div>
                  <div className="text-sm text-[var(--text-muted)]">
                    Recovery, strain, and sleep data
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
            {whoopError && (
              <div className="mt-3 text-sm p-3 rounded-lg bg-red-500/10 text-red-400">
                ⚠️ {whoopError}
              </div>
            )}
          </div>
        </motion.div>

        {/* API Setup Instructions */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
                <li>Set redirect URI to: <code className="bg-[var(--bg-tertiary)] px-1 rounded">https://triathalon.vercel.app/api/whoop/callback</code></li>
                <li>Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET to Vercel</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Google Calendar</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--swim-blue)] underline">Google Cloud Console</a></li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Enable Google Calendar API</li>
                <li>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel</li>
                <li>Add redirect URI: <code className="bg-[var(--bg-tertiary)] px-1 rounded">https://triathalon.vercel.app/api/auth/callback/google</code></li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Push Notifications (Optional)</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Generate VAPID keys: <code className="bg-[var(--bg-tertiary)] px-1 rounded">npx web-push generate-vapid-keys</code></li>
                <li>Add NEXT_PUBLIC_VAPID_PUBLIC_KEY to Vercel</li>
                <li>Add VAPID_PRIVATE_KEY to Vercel</li>
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
          transition={{ delay: 0.3 }}
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

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
