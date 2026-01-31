"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  Heart,
  Moon,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Unlink,
} from "lucide-react"
import { RecoveryRing } from "@/components"
import { getRecoveryAdjustment } from "@/lib/training-plan"

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
    maxHR?: number
  }
  sleep: {
    duration: number
    efficiency: number
    consistency?: number
  }
  lastUpdated: string
  hasData?: boolean
  _debug?: {
    hasRecovery: boolean
    hasCycle: boolean
    hasSleep: boolean
    rawRecoveryScore: number | null
    rawHrv: number | null
    rawRestingHR: number | null
  }
}

interface WhoopResponse {
  connected: boolean
  demo: boolean
  cached?: boolean
  data: WhoopData & { _debug?: WhoopData["_debug"] }
  message?: string
  lastSync?: string
}

export default function WhoopPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [response, setResponse] = useState<WhoopResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [historicalData, setHistoricalData] = useState<WhoopData[]>([])

  // Check for URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get("error")
    const urlMessage = params.get("message")
    const connected = params.get("connected")
    
    if (urlError) {
      setError(`Whoop error: ${urlError}${urlMessage ? ` - ${urlMessage}` : ''}`)
    }
    if (connected === "true") {
      // Clear URL params
      window.history.replaceState({}, '', '/whoop')
    }
  }, [])

  const fetchWhoopData = useCallback(async () => {
    try {
      const res = await fetch("/api/whoop")
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch Whoop data")
      }

      setResponse(data)
      if (data.message && data.demo) {
        // Show message but don't treat as error if it's just demo mode
        console.log("Whoop status:", data.message)
      } else {
        setError(null)
      }

      // Generate mock historical data for demo mode
      if (data.demo) {
        const history: WhoopData[] = []
        for (let i = 0; i < 7; i++) {
          history.push({
            recovery: {
              score: Math.floor(Math.random() * 40) + 50,
              hrv: Math.floor(Math.random() * 30) + 40,
              restingHR: Math.floor(Math.random() * 15) + 50,
              sleepPerformance: Math.floor(Math.random() * 20) + 70,
            },
            strain: {
              dayStrain: Math.random() * 8 + 4,
              calories: Math.floor(Math.random() * 500) + 2000,
              averageHR: Math.floor(Math.random() * 20) + 80,
            },
            sleep: {
              duration: Math.floor(Math.random() * 120) + 360,
              efficiency: Math.floor(Math.random() * 15) + 80,
            },
            lastUpdated: new Date().toISOString(),
          })
        }
        setHistoricalData(history)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWhoopData()
  }, [fetchWhoopData])

  const refreshData = async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const res = await fetch("/api/whoop", { cache: "no-store" })
      const data = await res.json()

      console.log("Whoop refresh response:", data)

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch Whoop data")
      }

      setResponse(data)
      if (data.message && data.demo) {
        console.log("Whoop status:", data.message)
      } else {
        setError(null)
      }

      // Generate mock historical data for demo mode
      if (data.demo) {
        const history: WhoopData[] = []
        for (let i = 0; i < 7; i++) {
          history.push({
            recovery: {
              score: Math.floor(Math.random() * 40) + 50,
              hrv: Math.floor(Math.random() * 30) + 40,
              restingHR: Math.floor(Math.random() * 15) + 50,
              sleepPerformance: Math.floor(Math.random() * 20) + 70,
            },
            strain: {
              dayStrain: Math.random() * 8 + 4,
              calories: Math.floor(Math.random() * 500) + 2000,
              averageHR: Math.floor(Math.random() * 20) + 80,
            },
            sleep: {
              duration: Math.floor(Math.random() * 120) + 360,
              efficiency: Math.floor(Math.random() * 15) + 80,
            },
            lastUpdated: new Date().toISOString(),
          })
        }
        setHistoricalData(history)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh data")
    } finally {
      setIsRefreshing(false)
    }
  }

  const connectWhoop = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const res = await fetch("/api/whoop/connect")
      const data = await res.json()

      console.log("Whoop connect response:", data)

      if (data.authUrl) {
        // Redirect to Whoop OAuth
        window.location.href = data.authUrl
      } else if (data.error) {
        if (data.error === "Unauthorized") {
          setError("Please sign in first to connect Whoop. Go to /login")
        } else if (data.error === "Whoop API not configured") {
          setError("Whoop API credentials not set. Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET to Vercel environment variables, then redeploy.")
        } else {
          setError(data.error)
        }
      } else {
        setError("Unexpected response from server")
      }
    } catch (err) {
      console.error("Whoop connect error:", err)
      setError("Failed to connect to Whoop. Check console for details.")
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWhoop = async () => {
    if (!confirm("Are you sure you want to disconnect Whoop?")) return

    try {
      const res = await fetch("/api/whoop", { method: "DELETE" })
      if (res.ok) {
        await fetchWhoopData()
      }
    } catch (err) {
      setError("Failed to disconnect Whoop")
    }
  }

  const whoopData = response?.data
  const isConnected = response?.connected && !response?.demo
  const isDemo = response?.demo

  const recoveryAdjustment = whoopData
    ? getRecoveryAdjustment(whoopData.recovery.score)
    : null

  // Calculate averages from historical data
  const avgRecovery = historicalData.length
    ? historicalData.reduce((sum, d) => sum + d.recovery.score, 0) / historicalData.length
    : 0
  const avgStrain = historicalData.length
    ? historicalData.reduce((sum, d) => sum + d.strain.dayStrain, 0) / historicalData.length
    : 0

  const getTrend = (current: number, avg: number) => {
    const diff = ((current - avg) / avg) * 100
    if (diff > 5) return { icon: TrendingUp, color: "text-green-400", label: "Above avg" }
    if (diff < -5) return { icon: TrendingDown, color: "text-red-400", label: "Below avg" }
    return { icon: Minus, color: "text-yellow-400", label: "Average" }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--swim-blue)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading Whoop data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Whoop Integration</h1>
            <p className="text-[var(--text-secondary)]">
              {isDemo
                ? "Demo mode - Connect Whoop for real data"
                : "Track your recovery and optimize your training"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                isConnected
                  ? "bg-green-500/10 text-green-400"
                  : isDemo
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {isConnected ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isConnected ? "Connected" : isDemo ? "Demo Mode" : "Disconnected"}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Sync Now
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Debug Info */}
        {response?.data?._debug && (
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm font-medium text-blue-400 mb-2">🔍 Debug Info</p>
            <div className="text-xs text-blue-400/80 font-mono space-y-1">
              <div>Connected: {isConnected ? "Yes" : "No"}</div>
              <div>Demo Mode: {isDemo ? "Yes" : "No"}</div>
              <div>Has Recovery Data: {response.data._debug.hasRecovery ? "Yes" : "No"}</div>
              <div>Has Cycle Data: {response.data._debug.hasCycle ? "Yes" : "No"}</div>
              <div>Has Sleep Data: {response.data._debug.hasSleep ? "Yes" : "No"}</div>
              <div>Raw Recovery Score: {response.data._debug.rawRecoveryScore ?? "null"}</div>
              <div>Raw HRV: {response.data._debug.rawHrv ?? "null"}</div>
              <div>Raw Resting HR: {response.data._debug.rawRestingHR ?? "null"}</div>
              {(response.data._debug as any).recoveryScoreState && (
                <div>Recovery State: {(response.data._debug as any).recoveryScoreState}</div>
              )}
              {(response.data._debug as any).sleepScoreState && (
                <div>Sleep State: {(response.data._debug as any).sleepScoreState}</div>
              )}
            </div>
          </div>
        )}

        {/* Demo Mode Banner */}
        {isDemo && (
          <motion.div
            className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-400">
                  {response?.message || "Using demo data"}
                </p>
                <p className="text-xs text-yellow-400/70 mt-1">
                  Connect your Whoop to see real recovery, strain, and sleep data.
                </p>
              </div>
              <button
                onClick={connectWhoop}
                disabled={isConnecting}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Connect Whoop
              </button>
            </div>
          </motion.div>
        )}

        {whoopData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Recovery Focus */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Recovery */}
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-lg font-semibold text-white mb-6">
                  Today&apos;s Recovery
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  <RecoveryRing score={whoopData.recovery.score} size={180} />

                  <div className="flex-1 space-y-4">
                    {/* Recovery Recommendation */}
                    {recoveryAdjustment && (
                      <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                        <p className="text-sm">
                          {recoveryAdjustment.adjustments.recommendation}
                        </p>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-[var(--text-muted)]">HRV</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {whoopData.recovery.hrv} ms
                        </div>
                        {historicalData.length > 0 && (() => {
                          const avgHrv = historicalData.reduce((s, d) => s + d.recovery.hrv, 0) / historicalData.length
                          const trend = getTrend(whoopData.recovery.hrv, avgHrv)
                          return (
                            <div className={`flex items-center gap-1 text-xs ${trend.color}`}>
                              <trend.icon className="w-3 h-3" />
                              {trend.label}
                            </div>
                          )
                        })()}
                      </div>
                      <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-4 h-4 text-pink-400" />
                          <span className="text-xs text-[var(--text-muted)]">Resting HR</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {whoopData.recovery.restingHR} bpm
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Strain & Sleep */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strain */}
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Day Strain</h3>
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-bold text-[var(--bike-orange)]">
                      {whoopData.strain.dayStrain.toFixed(1)}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">of 21.0 max</div>
                  </div>

                  {/* Strain bar */}
                  <div className="progress-bar mb-4">
                    <motion.div
                      className="progress-fill bg-[var(--bike-orange)]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(whoopData.strain.dayStrain / 21) * 100}%`,
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[var(--text-muted)]">Calories</div>
                      <div className="text-white font-medium">
                        {whoopData.strain.calories.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">Avg HR</div>
                      <div className="text-white font-medium">
                        {whoopData.strain.averageHR} bpm
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Sleep */}
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Sleep</h3>
                    <Moon className="w-5 h-5 text-blue-400" />
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-bold text-[var(--swim-blue)]">
                      {Math.floor(whoopData.sleep.duration / 60)}h{" "}
                      {whoopData.sleep.duration % 60}m
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">time asleep</div>
                  </div>

                  {/* Efficiency bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                      <span>Efficiency</span>
                      <span>{whoopData.sleep.efficiency}%</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill bg-[var(--swim-blue)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${whoopData.sleep.efficiency}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[var(--text-muted)]">Performance</div>
                      <div className="text-white font-medium">
                        {whoopData.recovery.sleepPerformance}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">Goal</div>
                      <div className="text-white font-medium">8h 0m</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 7-Day History */}
              {historicalData.length > 0 && (
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    7-Day Recovery Trend
                  </h3>

                  <div className="flex items-end justify-between h-32 gap-2">
                    {historicalData.map((data, index) => {
                      const height = (data.recovery.score / 100) * 100
                      const color =
                        data.recovery.score >= 67
                          ? "var(--run-green)"
                          : data.recovery.score >= 34
                          ? "#fbbf24"
                          : "#ef4444"

                      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <motion.div
                            className="w-full rounded-t-lg"
                            style={{ backgroundColor: color }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: index * 0.05, duration: 0.5 }}
                          />
                          <span className="text-xs text-[var(--text-muted)]">
                            {days[index]}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between mt-4 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">Avg Recovery:</span>{" "}
                      <span className="text-white font-medium">
                        {avgRecovery.toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Avg Strain:</span>{" "}
                      <span className="text-white font-medium">
                        {avgStrain.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Settings & Info */}
            <div className="space-y-6">
              {/* Connection Card */}
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#0066ff] flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">WHOOP</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {response?.lastSync
                        ? `Last synced: ${new Date(response.lastSync).toLocaleTimeString()}`
                        : isDemo
                        ? "Not connected"
                        : "Connected"}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <button
                    onClick={disconnectWhoop}
                    className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <Unlink className="w-4 h-4" />
                    Disconnect WHOOP
                  </button>
                ) : (
                  <button
                    onClick={connectWhoop}
                    disabled={isConnecting}
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Connect WHOOP
                  </button>
                )}
              </motion.div>

              {/* Training Adjustments */}
              {recoveryAdjustment && (
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Training Adjustments
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Based on your recovery score, we recommend:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]">
                      <span className="text-sm text-[var(--text-secondary)]">
                        Intensity
                      </span>
                      <span className="text-sm font-medium text-white">
                        {Math.round(recoveryAdjustment.adjustments.intensityModifier * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]">
                      <span className="text-sm text-[var(--text-secondary)]">
                        Volume
                      </span>
                      <span className="text-sm font-medium text-white">
                        {Math.round(recoveryAdjustment.adjustments.volumeModifier * 100)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tips */}
              <motion.div
                className="glass-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recovery Tips
                </h3>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span>💧</span>
                    Drink at least 100oz of water today
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🥩</span>
                    Hit your 200g protein target
                  </li>
                  <li className="flex items-start gap-2">
                    <span>😴</span>
                    Aim for 8+ hours of sleep
                  </li>
                  <li className="flex items-start gap-2">
                    <span>🦶</span>
                    Do your ankle mobility exercises
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
