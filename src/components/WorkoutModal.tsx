"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Clock,
  Flame,
  AlertTriangle,
  Check,
  Calendar,
  ChevronRight,
} from "lucide-react"
import type { WorkoutTemplate, Exercise } from "@/lib/training-plan"

interface WorkoutModalProps {
  workout: WorkoutTemplate | null
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  onSkip?: () => void
  onAddToCalendar?: () => void
  recoveryScore?: number
  adjustedWorkout?: WorkoutTemplate
}

export function WorkoutModal({
  workout,
  isOpen,
  onClose,
  onComplete,
  onSkip,
  onAddToCalendar,
  recoveryScore,
  adjustedWorkout,
}: WorkoutModalProps) {
  if (!workout) return null

  const displayWorkout = adjustedWorkout || workout
  const isAdjusted = !!adjustedWorkout

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="glass-card h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {displayWorkout.title}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {displayWorkout.description}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Recovery adjustment warning */}
              {isAdjusted && recoveryScore !== undefined && (
                <div className="mx-6 mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">
                        Workout Adjusted Based on Recovery
                      </p>
                      <p className="text-xs text-yellow-400/70 mt-1">
                        Your recovery score is {recoveryScore}%. We&apos;ve reduced the
                        intensity and duration to protect your body.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-2 text-[var(--swim-blue)]" />
                    <div className="text-lg font-bold text-white">
                      {displayWorkout.duration}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Minutes</div>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 text-center">
                    <Flame className="w-5 h-5 mx-auto mb-2 text-[var(--bike-orange)]" />
                    <div className="text-lg font-bold text-white capitalize">
                      {displayWorkout.intensity}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Intensity</div>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 text-center">
                    <div className="w-5 h-5 mx-auto mb-2 rounded-full bg-[var(--run-green)]" />
                    <div className="text-lg font-bold text-white capitalize">
                      {displayWorkout.type.replace("_", " ")}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Type</div>
                  </div>
                </div>

                {/* Exercises */}
                {displayWorkout.exercises && displayWorkout.exercises.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
                      Exercises
                    </h3>
                    <div className="space-y-2">
                      {displayWorkout.exercises.map((exercise, index) => (
                        <ExerciseRow key={index} exercise={exercise} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {displayWorkout.notes && displayWorkout.notes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
                      Notes
                    </h3>
                    <div className="space-y-2">
                      {displayWorkout.notes.map((note, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <ChevronRight className="w-4 h-4 text-[var(--swim-blue)] flex-shrink-0 mt-0.5" />
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="p-6 border-t border-[var(--border-subtle)]">
                <div className="flex gap-3">
                  {onAddToCalendar && (
                    <button
                      onClick={onAddToCalendar}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Add to Calendar
                    </button>
                  )}
                  {onSkip && (
                    <button
                      onClick={onSkip}
                      className="btn-secondary px-6"
                    >
                      Skip
                    </button>
                  )}
                  {onComplete && (
                    <button
                      onClick={onComplete}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ExerciseRow({ exercise, index }: { exercise: Exercise; index: number }) {
  return (
    <motion.div
      className="flex items-center gap-4 p-4 bg-[var(--bg-tertiary)] rounded-xl"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-sm font-bold text-[var(--text-muted)]">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white">{exercise.name}</div>
        {exercise.notes && (
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {exercise.notes}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-[var(--swim-blue)]">
          {exercise.sets}×{exercise.reps}
        </div>
        {exercise.rpe && (
          <div className="text-xs text-[var(--text-muted)]">RPE {exercise.rpe}</div>
        )}
      </div>
    </motion.div>
  )
}
