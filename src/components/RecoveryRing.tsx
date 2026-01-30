"use client"

import { motion } from "framer-motion"

interface RecoveryRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function RecoveryRing({
  score,
  size = 160,
  strokeWidth = 12,
  showLabel = true,
}: RecoveryRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  // Color based on recovery score
  const getColor = (score: number) => {
    if (score >= 67) return "#00ff88" // Green
    if (score >= 34) return "#fbbf24" // Yellow
    return "#ef4444" // Red
  }

  const color = getColor(score)
  const label = score >= 67 ? "Ready to Train" : score >= 34 ? "Moderate" : "Rest Day"

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="recovery-ring"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: `drop-shadow(0 0 10px ${color}40)`,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="stat-value"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        {showLabel && (
          <motion.span
            className="stat-label mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  )
}
