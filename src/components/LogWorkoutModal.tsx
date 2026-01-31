"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Clock,
  Flame,
  Heart,
  Zap,
  Check,
  TrendingUp,
  TrendingDown,
  Waves,
  Bike,
  Footprints,
  Dumbbell,
  Sparkles,
} from "lucide-react"

export interface LoggedWorkout {
  id: string
  type: string
  title: string
  plannedDuration: number
  actualDuration: number
  plannedIntensity: string
  actualIntensity: "easier" | "as_planned" | "harder"
  perceivedEffort: number // 1-10 RPE
  notes: string
  timestamp: string
  strainGenerated?: number
}

interface LogWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  onLog: (workout: LoggedWorkout) => void
  suggestedWorkout?: {
    title: string
    type: string
    duration: number
    intensity: string
  }
  currentStrain?: number
}

const workoutTypes = [
  { type: "swim", label: "Swim", icon: Waves, color: "var(--swim-blue)" },
  { type: "bike", label: "Bike", icon: Bike, color: "var(--bike-orange)" },
  { type: "run", label: "Run", icon: Footprints, color: "var(--run-green)" },
  { type: "lift_upper", label: "Upper Body", icon: Dumbbell, color: "var(--lift-purple)" },
  { type: "lift_lower", label: "Lower Body", icon: Dumbbell, color: "var(--lift-purple)" },
  { type: "mobility", label: "Mobility", icon: Sparkles, color: "#14b8a6" },
  { type: "other", label: "Other", icon: Zap, color: "#f59e0b" },
]

const rpeDescriptions: Record<number, string> = {
  1: "Very Light - Could do this all day",
  2: "Light - Comfortable, easy breathing",
  3: "Light - Still comfortable",
  4: "Moderate - Breathing heavier",
  5: "Moderate - Challenging but sustainable",
  6: "Hard - Can talk in short sentences",
  7: "Hard - Difficult to maintain",
  8: "Very Hard - Can only say a few words",
  9: "Max Effort - Almost everything",
  10: "Max Effort - Absolute maximum",
}

export function LogWorkoutModal({
  isOpen,
  onClose,
  onLog,
  suggestedWorkout,
  currentStrain = 0,
}: LogWorkoutModalProps) {
  const [type, setType] = useState(suggestedWorkout?.type || "run")
  const [title, setTitle] = useState(suggestedWorkout?.title || "")
  const [plannedDuration, setPlannedDuration] = useState(suggestedWorkout?.duration || 30)
  const [actualDuration, setActualDuration] = useState(suggestedWorkout?.duration || 30)
  const [actualIntensity, setActualIntensity] = useState<"easier" | "as_planned" | "harder">("as_planned")
  const [perceivedEffort, setPerceivedEffort] = useState(5)
  const [notes, setNotes] = useState("")

  // Estimate strain generated based on duration and RPE
  const estimatedStrain = Math.min(21, (actualDuration / 60) * (perceivedEffort / 5) * 3)

  const handleSubmit = () => {
    const workout: LoggedWorkout = {
      id: crypto.randomUUID(),
      type,
      title: title || `${workoutTypes.find(w => w.type === type)?.label} Workout`,
      plannedDuration,
      actualDuration,
      plannedIntensity: suggestedWorkout?.intensity || "moderate",
      actualIntensity,
      perceivedEffort,
      notes,
      timestamp: new Date().toISOString(),
      strainGenerated: estimatedStrain,
    }

    onLog(workout)
    onClose()

    // Reset form
    setType("run")
    setTitle("")
    setActualDuration(30)
    setActualIntensity("as_planned")
    setPerceivedEffort(5)
    setNotes("")
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
          className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Log Workout</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Record what you just did
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Workout Type */}
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Workout Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {workoutTypes.map(({ type: t, label, icon: Icon, color }) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      type === t
                        ? "ring-2"
                        : "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                    style={type === t ? { 
                      backgroundColor: `${color}20`,
                      boxShadow: `0 0 0 2px ${color}`,
                    } : {}}
                  >
                    <Icon className="w-5 h-5" style={{ color: type === t ? color : undefined }} />
                    <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Workout Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={suggestedWorkout?.title || "e.g., Morning Run"}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)]"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Actual Duration (minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={180}
                  value={actualDuration}
                  onChange={(e) => setActualDuration(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="w-20 text-center">
                  <span className="text-xl font-bold text-white">{actualDuration}</span>
                  <span className="text-sm text-[var(--text-muted)]"> min</span>
                </div>
              </div>
              {suggestedWorkout && actualDuration !== plannedDuration && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${
                  actualDuration > plannedDuration ? "text-red-400" : "text-yellow-400"
                }`}>
                  {actualDuration > plannedDuration ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(actualDuration - plannedDuration)} min {actualDuration > plannedDuration ? "more" : "less"} than planned
                </div>
              )}
            </div>

            {/* Intensity vs Planned */}
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                How was the intensity?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "easier", label: "Easier", color: "text-green-400", bg: "bg-green-500/10" },
                  { value: "as_planned", label: "As Planned", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { value: "harder", label: "Harder", color: "text-red-400", bg: "bg-red-500/10" },
                ].map(({ value, label, color, bg }) => (
                  <button
                    key={value}
                    onClick={() => setActualIntensity(value as typeof actualIntensity)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      actualIntensity === value
                        ? `${bg} ${color} ring-2 ring-current`
                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* RPE Scale */}
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Rate of Perceived Effort (RPE)
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                    <button
                      key={rpe}
                      onClick={() => setPerceivedEffort(rpe)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                        perceivedEffort === rpe
                          ? rpe <= 3
                            ? "bg-green-500 text-white"
                            : rpe <= 6
                            ? "bg-yellow-500 text-black"
                            : rpe <= 8
                            ? "bg-orange-500 text-white"
                            : "bg-red-500 text-white"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"
                      }`}
                    >
                      {rpe}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {rpeDescriptions[perceivedEffort]}
                </p>
              </div>
            </div>

            {/* Estimated Strain */}
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-[var(--text-muted)]">Estimated Strain</span>
                </div>
                <span className="text-lg font-bold text-[var(--bike-orange)]">
                  +{estimatedStrain.toFixed(1)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-[var(--bike-orange)]"
                  style={{ width: `${(estimatedStrain / 21) * 100}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Total today: {(currentStrain + estimatedStrain).toFixed(1)} / 21
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did you feel? Any pain or discomfort?"
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-white focus:outline-none focus:border-[var(--swim-blue)] resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Log Workout
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
