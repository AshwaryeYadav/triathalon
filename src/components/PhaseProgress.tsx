"use client"

import { motion } from "framer-motion"
import { phases, type PhaseConfig } from "@/lib/training-plan"

interface PhaseProgressProps {
  currentWeek: number
  raceDate: Date
}

export function PhaseProgress({ currentWeek, raceDate }: PhaseProgressProps) {
  const totalWeeks = 10
  const progressPercent = (currentWeek / totalWeeks) * 100
  
  // Calculate days until race
  const today = new Date()
  const daysUntilRace = Math.ceil(
    (raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Training Progress</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Week {currentWeek} of {totalWeeks}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[var(--swim-blue)]">
            {daysUntilRace}
          </div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Days to Race
          </div>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="relative mb-6">
        {/* Background track */}
        <div className="h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          {/* Progress fill */}
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, 
                var(--swim-blue) 0%, 
                var(--bike-orange) 50%, 
                var(--run-green) 100%
              )`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Phase markers */}
        <div className="flex justify-between mt-2">
          {phases.map((phase, index) => {
            const phaseStart = (phase.weeks[0] - 1) / totalWeeks * 100
            const isActive = phase.weeks.includes(currentWeek)
            const isPast = currentWeek > phase.weeks[phase.weeks.length - 1]
            
            return (
              <div
                key={phase.name}
                className="flex flex-col items-center"
                style={{ 
                  position: index === 0 ? "relative" : "relative",
                  left: index === 0 ? "0" : "auto",
                }}
              >
                <div
                  className={`
                    w-3 h-3 rounded-full border-2 -mt-[22px] mb-2
                    ${isActive 
                      ? "bg-[var(--swim-blue)] border-[var(--swim-blue)]" 
                      : isPast 
                        ? "bg-[var(--run-green)] border-[var(--run-green)]"
                        : "bg-[var(--bg-tertiary)] border-[var(--border-subtle)]"
                    }
                  `}
                />
                <span
                  className={`
                    text-xs font-medium
                    ${isActive ? "text-white" : "text-[var(--text-muted)]"}
                  `}
                >
                  {phase.description}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Wk {phase.weeks[0]}-{phase.weeks[phase.weeks.length - 1]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Current phase details */}
      {phases.find(p => p.weeks.includes(currentWeek)) && (
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
          <h4 className="font-medium text-white mb-2">
            Current Phase Goals
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {phases
              .find(p => p.weeks.includes(currentWeek))
              ?.goals.map((goal, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--swim-blue)]" />
                  {goal}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
