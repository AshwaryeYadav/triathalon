// Training Plan for Sprint Triathlon - April 11, 2026
// Designed for: 6'2", 205lbs, former athlete, Lisfranc injury recovery

export type WorkoutType = 'swim' | 'bike' | 'run' | 'lift_upper' | 'lift_lower' | 'brick' | 'rest' | 'mobility'
export type Phase = 'rebuild' | 'build' | 'peak'
export type Intensity = 'easy' | 'moderate' | 'hard' | 'race_pace'

export interface Exercise {
  name: string
  sets: number
  reps: string // e.g., "6-8" or "30 sec"
  notes?: string
  rpe?: string // Rate of Perceived Exertion
}

export interface WorkoutTemplate {
  title: string
  type: WorkoutType
  duration: number // minutes
  intensity: Intensity
  description: string
  exercises?: Exercise[]
  notes?: string[]
}

// Upper Body Workout - Monday
export const upperBodyWorkout: WorkoutTemplate = {
  title: "Upper Body Strength",
  type: "lift_upper",
  duration: 65,
  intensity: "moderate",
  description: "Push/Pull strength focus with accessory work",
  exercises: [
    // Warm-up
    { name: "Band Pull-Aparts", sets: 2, reps: "20", notes: "Light activation" },
    { name: "Shoulder CARs", sets: 1, reps: "10/side", notes: "Controlled circles" },
    { name: "Push-ups", sets: 1, reps: "10", notes: "Warm-up set" },
    { name: "Light Cable Rows", sets: 1, reps: "15", notes: "Get blood flowing" },
    
    // Main Lifts
    { name: "Barbell Bench Press", sets: 4, reps: "6-8", rpe: "7-8", notes: "2 reps in tank" },
    { name: "Weighted Pull-ups or Lat Pulldown", sets: 4, reps: "6-10", notes: "Full stretch, controlled" },
    { name: "Standing DB Overhead Press", sets: 3, reps: "8", notes: "Neutral grip if needed" },
    { name: "Chest-Supported Row", sets: 3, reps: "8-10", notes: "Squeeze at top" },
    
    // Accessories (Superset)
    { name: "Lateral Raises", sets: 3, reps: "12-15", notes: "Superset with Face Pulls" },
    { name: "Face Pulls", sets: 3, reps: "15-20", notes: "External rotation at top" },
    
    // Core
    { name: "Hanging Knee Raises", sets: 3, reps: "12-15", notes: "Or dead bugs if needed" },
  ],
  notes: [
    "Focus on controlled tempo",
    "Rest 2-3 min between main lifts",
    "Rest 60-90 sec on accessories",
  ],
}

// Lower Body Workout - Wednesday
export const lowerBodyWorkout: WorkoutTemplate = {
  title: "Lower Body Strength (Foot-Smart)",
  type: "lift_lower",
  duration: 60,
  intensity: "moderate",
  description: "Athletic lower body focus - protecting the foot",
  exercises: [
    // Warm-up
    { name: "Ankle Mobility Circles", sets: 1, reps: "10/direction/side", notes: "Pain-free range" },
    { name: "Short-Foot Exercise", sets: 1, reps: "10/side", notes: "Arch activation" },
    { name: "Glute Bridges", sets: 2, reps: "15", notes: "Full hip extension" },
    { name: "Bodyweight Split Squats", sets: 1, reps: "10/side", notes: "Warm-up depth" },
    
    // Main Lifts
    { name: "Trap Bar Deadlift", sets: 4, reps: "5", rpe: "7-8", notes: "Preferred over straight bar" },
    { name: "Rear-Foot Elevated Split Squat", sets: 3, reps: "8/side", notes: "3 sec eccentric, light push" },
    { name: "Hip Thrust or Glute Bridge", sets: 3, reps: "8-10", notes: "Full squeeze at top" },
    { name: "Lying Hamstring Curl", sets: 3, reps: "10-12", notes: "Controlled tempo" },
    
    // Lower Leg & Stability
    { name: "Single-Leg Calf Raise", sets: 3, reps: "12/side", notes: "Slow 3-1-3 tempo" },
    { name: "Tibialis Raises", sets: 3, reps: "15", notes: "Protect the shins" },
    
    // Core
    { name: "Pallof Press", sets: 3, reps: "30-45 sec/side", notes: "Anti-rotation focus" },
  ],
  notes: [
    "NO jumping or plyometrics",
    "NO max effort singles",
    "If foot pain >2/10, stop and modify",
  ],
}

// Weekly workout schedule template
export interface DaySchedule {
  dayOfWeek: number // 0 = Monday
  dayName: string
  workouts: WorkoutTemplate[]
}

export const weeklySchedulePhase1: DaySchedule[] = [
  {
    dayOfWeek: 0,
    dayName: "Monday",
    workouts: [
      upperBodyWorkout,
      {
        title: "Easy Swim",
        type: "swim",
        duration: 35,
        intensity: "easy",
        description: "Technique-focused aerobic swim",
        notes: [
          "800-1200m total",
          "Focus on long strokes",
          "Breathing every 3 strokes",
          "Rest as needed at wall",
        ],
      },
    ],
  },
  {
    dayOfWeek: 1,
    dayName: "Tuesday",
    workouts: [
      {
        title: "Zone 2 Bike",
        type: "bike",
        duration: 40,
        intensity: "easy",
        description: "Aerobic base building on the bike",
        notes: [
          "30-40 min steady effort",
          "Heart rate 60-70% max",
          "Conversational pace",
          "Focus on pedaling technique",
        ],
      },
      {
        title: "Short Run",
        type: "run",
        duration: 15,
        intensity: "easy",
        description: "Transition run - foot tolerance test",
        notes: [
          "10-15 min easy pace",
          "Treadmill or soft surface preferred",
          "Cadence >170 spm",
          "Stop if foot pain >2/10",
        ],
      },
    ],
  },
  {
    dayOfWeek: 2,
    dayName: "Wednesday",
    workouts: [
      lowerBodyWorkout,
    ],
  },
  {
    dayOfWeek: 3,
    dayName: "Thursday",
    workouts: [
      {
        title: "Technique Swim",
        type: "swim",
        duration: 30,
        intensity: "easy",
        description: "Drill-focused swim session",
        notes: [
          "600-800m total",
          "Catch-up drill: 4x50",
          "Fingertip drag: 4x25",
          "Easy continuous: 200-400m",
        ],
      },
      {
        title: "Brick Workout",
        type: "brick",
        duration: 30,
        intensity: "moderate",
        description: "Bike-to-run transition practice",
        notes: [
          "Bike: 20 min moderate",
          "Quick transition (2-3 min)",
          "Run: 5-10 min easy",
          "Feel the 'brick legs'",
        ],
      },
    ],
  },
  {
    dayOfWeek: 4,
    dayName: "Friday",
    workouts: [
      {
        title: "Active Recovery / Mobility",
        type: "mobility",
        duration: 30,
        intensity: "easy",
        description: "Light movement and stretching",
        notes: [
          "Foam rolling: 10 min",
          "Hip flexor stretches",
          "Thoracic spine mobility",
          "Ankle/foot exercises",
        ],
      },
    ],
  },
  {
    dayOfWeek: 5,
    dayName: "Saturday",
    workouts: [
      {
        title: "Long Bike",
        type: "bike",
        duration: 60,
        intensity: "easy",
        description: "Aerobic endurance ride",
        notes: [
          "45-60 min steady",
          "Zone 2 effort",
          "Practice nutrition",
          "Comfortable cadence 80-90 rpm",
        ],
      },
    ],
  },
  {
    dayOfWeek: 6,
    dayName: "Sunday",
    workouts: [
      {
        title: "Rest Day",
        type: "rest",
        duration: 0,
        intensity: "easy",
        description: "Full recovery - let your body adapt",
        notes: [
          "Sleep 8+ hours",
          "Stay hydrated",
          "Light walking OK",
          "Mental reset",
        ],
      },
    ],
  },
]

export const weeklySchedulePhase2: DaySchedule[] = [
  {
    dayOfWeek: 0,
    dayName: "Monday",
    workouts: [
      { ...upperBodyWorkout, notes: [...(upperBodyWorkout.notes || []), "Heavier weights this phase"] },
      {
        title: "Endurance Swim",
        type: "swim",
        duration: 45,
        intensity: "moderate",
        description: "Building swim endurance",
        notes: [
          "1200-1600m total",
          "Main set: 4x200 moderate",
          "Rest 30 sec between reps",
          "Cool down 200 easy",
        ],
      },
    ],
  },
  {
    dayOfWeek: 1,
    dayName: "Tuesday",
    workouts: [
      {
        title: "Bike Intervals",
        type: "bike",
        duration: 45,
        intensity: "hard",
        description: "Building bike power",
        notes: [
          "10 min warm-up",
          "4x4 min hard / 2 min easy",
          "10 min cool-down",
          "Feel the burn!",
        ],
      },
      {
        title: "Transition Run",
        type: "run",
        duration: 20,
        intensity: "easy",
        description: "Building run tolerance",
        notes: [
          "15-20 min easy",
          "Stay relaxed",
          "Quick feet, light steps",
        ],
      },
    ],
  },
  {
    dayOfWeek: 2,
    dayName: "Wednesday",
    workouts: [
      lowerBodyWorkout,
    ],
  },
  {
    dayOfWeek: 3,
    dayName: "Thursday",
    workouts: [
      {
        title: "Race Pace Swim",
        type: "swim",
        duration: 40,
        intensity: "hard",
        description: "Race simulation sets",
        notes: [
          "Warm-up 300",
          "Main: 6x100 race pace, 20 sec rest",
          "4x50 fast, 15 sec rest",
          "Cool-down 200",
        ],
      },
      {
        title: "Race Sim Brick",
        type: "brick",
        duration: 45,
        intensity: "moderate",
        description: "Longer brick workout",
        notes: [
          "Bike: 30 min at race effort",
          "Transition: 2 min",
          "Run: 10-15 min moderate",
          "Practice race day fueling",
        ],
      },
    ],
  },
  {
    dayOfWeek: 4,
    dayName: "Friday",
    workouts: [
      {
        title: "Optional Full Body / Recovery",
        type: "lift_upper",
        duration: 40,
        intensity: "easy",
        description: "Light maintenance work",
        exercises: [
          { name: "Incline DB Press", sets: 3, reps: "10", notes: "Light weight" },
          { name: "Single-Arm DB Row", sets: 3, reps: "10/side" },
          { name: "Goblet Squat", sets: 3, reps: "12", notes: "Deep but controlled" },
          { name: "Romanian Deadlift", sets: 3, reps: "10", notes: "Hamstring focus" },
          { name: "Farmer Carries", sets: 3, reps: "30-40m", notes: "Core stability" },
        ],
        notes: ["Skip if feeling beat up"],
      },
    ],
  },
  {
    dayOfWeek: 5,
    dayName: "Saturday",
    workouts: [
      {
        title: "Race Simulation Bike",
        type: "bike",
        duration: 75,
        intensity: "moderate",
        description: "Long ride with race effort sections",
        notes: [
          "60-75 min total",
          "Include 20 min at race pace",
          "Practice drinking/fueling",
          "Optional 5-10 min run after",
        ],
      },
    ],
  },
  {
    dayOfWeek: 6,
    dayName: "Sunday",
    workouts: [
      {
        title: "Rest Day",
        type: "rest",
        duration: 0,
        intensity: "easy",
        description: "Recovery and adaptation",
        notes: [
          "Prioritize sleep",
          "Active recovery walk OK",
          "Prep meals for the week",
        ],
      },
    ],
  },
]

// Phase configuration
export interface PhaseConfig {
  name: Phase
  weeks: number[]
  description: string
  goals: string[]
  liftingFrequency: number
  runVolumeCap: number // max minutes per week
}

export const phases: PhaseConfig[] = [
  {
    name: "rebuild",
    weeks: [1, 2, 3],
    description: "Rebuild & Protect",
    goals: [
      "Build aerobic base safely",
      "Test foot tolerance",
      "Establish strength foundation",
      "Learn technique",
    ],
    liftingFrequency: 3,
    runVolumeCap: 45,
  },
  {
    name: "build",
    weeks: [4, 5, 6, 7],
    description: "Build & Sharpen",
    goals: [
      "Race-specific endurance",
      "Build confidence",
      "Increase intensity",
      "Perfect transitions",
    ],
    liftingFrequency: 3,
    runVolumeCap: 60,
  },
  {
    name: "peak",
    weeks: [8, 9, 10],
    description: "Peak & Taper",
    goals: [
      "Feel fast, not tired",
      "Reduce volume",
      "Maintain intensity",
      "Race day prep",
    ],
    liftingFrequency: 2,
    runVolumeCap: 45,
  },
]

// Nutrition guidelines
export const nutritionGuidelines = {
  dailyProtein: 200, // grams
  preworkoutCarbs: "30-50g complex carbs 1-2 hours before",
  postWorkout: "30g protein + 50g carbs within 30 min",
  hydration: "Half bodyweight in ounces daily (100+ oz)",
  sleepHours: 8,
}

// Helper function to get phase by week
export function getPhaseByWeek(week: number): PhaseConfig {
  return phases.find(p => p.weeks.includes(week)) || phases[0]
}

// Helper function to get schedule by phase
export function getScheduleByPhase(phase: Phase): DaySchedule[] {
  switch (phase) {
    case "rebuild":
      return weeklySchedulePhase1
    case "build":
      return weeklySchedulePhase2
    case "peak":
      // Peak phase is similar to build but with reduced volume
      return weeklySchedulePhase2.map(day => ({
        ...day,
        workouts: day.workouts.map(w => ({
          ...w,
          duration: Math.round(w.duration * 0.7), // 30% reduction
        })),
      }))
    default:
      return weeklySchedulePhase1
  }
}

// Recovery-based adjustments
export interface RecoveryAdjustment {
  recoveryRange: [number, number] // min, max recovery score
  adjustments: {
    intensityModifier: number // multiply planned intensity
    volumeModifier: number // multiply planned duration
    recommendation: string
  }
}

export const recoveryAdjustments: RecoveryAdjustment[] = [
  {
    recoveryRange: [0, 33],
    adjustments: {
      intensityModifier: 0.5,
      volumeModifier: 0.6,
      recommendation: "🔴 Low recovery: Consider rest or very light mobility only. Your body needs repair.",
    },
  },
  {
    recoveryRange: [34, 66],
    adjustments: {
      intensityModifier: 0.8,
      volumeModifier: 0.85,
      recommendation: "🟡 Moderate recovery: Reduce intensity. Focus on technique over power.",
    },
  },
  {
    recoveryRange: [67, 100],
    adjustments: {
      intensityModifier: 1.0,
      volumeModifier: 1.0,
      recommendation: "🟢 Good recovery: You're ready to train as planned. Push appropriately!",
    },
  },
]

export function getRecoveryAdjustment(recoveryScore: number): RecoveryAdjustment {
  return recoveryAdjustments.find(
    adj => recoveryScore >= adj.recoveryRange[0] && recoveryScore <= adj.recoveryRange[1]
  ) || recoveryAdjustments[2]
}

// ============================================
// WHOOP WORKOUT DETECTION & AUTO-ADJUSTMENT
// ============================================

// Map Whoop sport names to our workout types
export const whoopSportToWorkoutType: Record<string, WorkoutType> = {
  // Swimming
  "swimming": "swim",
  "diving": "swim",
  "water_polo": "swim",
  
  // Biking
  "cycling": "bike",
  "spinning": "bike",
  "spin": "bike",
  "mountain_biking": "bike",
  "assault_bike": "bike",
  
  // Running
  "running": "run",
  "track_&_field": "run",
  "hiking/rucking": "run",
  "walking": "run",
  "stairmaster": "run",
  "elliptical": "run",
  
  // Strength/Lifting
  "weightlifting": "lift_lower", // Could be either
  "functional_fitness": "lift_lower",
  "powerlifting": "lift_lower",
  "crossfit": "lift_upper",
  "hiit": "lift_upper",
  "box_fitness": "lift_upper",
  "barre": "lift_upper",
  "pilates": "lift_upper",
  
  // Triathlon/Brick
  "triathlon": "brick",
  "duathlon": "brick",
  
  // Mobility/Recovery
  "yoga": "mobility",
  "stretching": "mobility",
  "meditation": "mobility",
  "massage_therapy": "mobility",
  "sauna": "mobility",
  "ice_bath": "mobility",
  "air_compression": "mobility",
  "percussive_massage": "mobility",
}

// Detected workout from Whoop
export interface DetectedWorkout {
  id: string
  sport: string
  matchedType: WorkoutType | null
  strain: number
  duration: number // minutes
  calories: number
  averageHR: number
  maxHR: number
  distance: number | null
  start: string
  end: string
}

// Match a Whoop workout to a planned workout
export interface WorkoutMatch {
  detected: DetectedWorkout
  planned: WorkoutTemplate | null
  matchScore: number // 0-100 how well it matches
  isExtraWorkout: boolean // Did more than planned
  adjustmentNeeded: WorkoutAdjustment | null
}

// Adjustment for next workout based on what was done
export interface WorkoutAdjustment {
  reason: string
  durationChange: number // percentage (-20 means reduce 20%)
  intensityChange: number // percentage
  recommendation: string
  skipNextIfHard: boolean
}

// Detect workout type from Whoop sport name
export function detectWorkoutType(sportName: string): WorkoutType | null {
  const normalizedSport = sportName.toLowerCase().replace(/_/g, " ").trim()
  
  // Direct match
  if (whoopSportToWorkoutType[normalizedSport]) {
    return whoopSportToWorkoutType[normalizedSport]
  }
  
  // Fuzzy matching
  for (const [sport, type] of Object.entries(whoopSportToWorkoutType)) {
    if (normalizedSport.includes(sport.replace(/_/g, " ")) || 
        sport.replace(/_/g, " ").includes(normalizedSport)) {
      return type
    }
  }
  
  // Check for keywords
  if (normalizedSport.includes("swim")) return "swim"
  if (normalizedSport.includes("bike") || normalizedSport.includes("cycling")) return "bike"
  if (normalizedSport.includes("run") || normalizedSport.includes("jog")) return "run"
  if (normalizedSport.includes("lift") || normalizedSport.includes("weight") || normalizedSport.includes("strength")) return "lift_lower"
  if (normalizedSport.includes("yoga") || normalizedSport.includes("stretch") || normalizedSport.includes("mobility")) return "mobility"
  
  return null
}

// Calculate how well a detected workout matches a planned workout
export function calculateMatchScore(detected: DetectedWorkout, planned: WorkoutTemplate): number {
  let score = 0
  
  // Type match (most important)
  if (detected.matchedType === planned.type) {
    score += 50
  } else if (
    // Close matches
    (detected.matchedType === "lift_upper" && planned.type === "lift_lower") ||
    (detected.matchedType === "lift_lower" && planned.type === "lift_upper")
  ) {
    score += 30
  }
  
  // Duration match (within 20% = good)
  const durationRatio = detected.duration / planned.duration
  if (durationRatio >= 0.8 && durationRatio <= 1.2) {
    score += 30
  } else if (durationRatio >= 0.5 && durationRatio <= 1.5) {
    score += 15
  }
  
  // Intensity match based on strain
  const strainToIntensity = detected.strain < 8 ? "easy" : detected.strain < 14 ? "moderate" : "hard"
  if (strainToIntensity === planned.intensity) {
    score += 20
  } else if (
    (strainToIntensity === "moderate" && planned.intensity === "easy") ||
    (strainToIntensity === "moderate" && planned.intensity === "hard")
  ) {
    score += 10
  }
  
  return Math.min(score, 100)
}

// Calculate adjustment for next workout based on what was done
export function calculateWorkoutAdjustment(
  detected: DetectedWorkout,
  planned: WorkoutTemplate | null,
  recoveryScore: number
): WorkoutAdjustment | null {
  // If workout was much harder than planned
  if (detected.strain > 15) {
    return {
      reason: `High strain workout (${detected.strain.toFixed(1)})`,
      durationChange: -20,
      intensityChange: -20,
      recommendation: "Reduce next similar workout - you pushed hard today",
      skipNextIfHard: true,
    }
  }
  
  // If did more duration than planned
  if (planned && detected.duration > planned.duration * 1.3) {
    return {
      reason: `Exceeded planned duration by ${Math.round(((detected.duration / planned.duration) - 1) * 100)}%`,
      durationChange: -15,
      intensityChange: 0,
      recommendation: "Good effort! Slightly reduce tomorrow to recover",
      skipNextIfHard: false,
    }
  }
  
  // If recovery is low but still trained
  if (recoveryScore < 40 && detected.strain > 10) {
    return {
      reason: "Trained on low recovery",
      durationChange: -25,
      intensityChange: -30,
      recommendation: "⚠️ You trained hard on low recovery. Consider rest tomorrow.",
      skipNextIfHard: true,
    }
  }
  
  // If did an extra unplanned workout
  if (!planned && detected.strain > 8) {
    return {
      reason: "Extra unplanned workout",
      durationChange: -10,
      intensityChange: -10,
      recommendation: "Nice extra work! Adjust tomorrow's plan slightly",
      skipNextIfHard: false,
    }
  }
  
  return null
}

// Match detected workouts to today's planned workouts
export function matchWorkoutsForDay(
  detectedWorkouts: DetectedWorkout[],
  plannedWorkouts: WorkoutTemplate[],
  recoveryScore: number
): WorkoutMatch[] {
  const matches: WorkoutMatch[] = []
  const usedPlanned = new Set<number>()
  
  for (const detected of detectedWorkouts) {
    let bestMatch: WorkoutTemplate | null = null
    let bestScore = 0
    let bestIndex = -1
    
    // Find best matching planned workout
    for (let i = 0; i < plannedWorkouts.length; i++) {
      if (usedPlanned.has(i)) continue
      
      const score = calculateMatchScore(detected, plannedWorkouts[i])
      if (score > bestScore) {
        bestScore = score
        bestMatch = plannedWorkouts[i]
        bestIndex = i
      }
    }
    
    // Only consider it a match if score is reasonable
    if (bestScore >= 40 && bestIndex >= 0) {
      usedPlanned.add(bestIndex)
    } else {
      bestMatch = null
      bestScore = 0
    }
    
    const adjustment = calculateWorkoutAdjustment(detected, bestMatch, recoveryScore)
    
    matches.push({
      detected,
      planned: bestMatch,
      matchScore: bestScore,
      isExtraWorkout: !bestMatch,
      adjustmentNeeded: adjustment,
    })
  }
  
  return matches
}

// Get recommended adjustments for tomorrow's workout
export function getNextWorkoutAdjustments(
  todayMatches: WorkoutMatch[],
  recoveryScore: number,
  tomorrowWorkouts: WorkoutTemplate[]
): { workout: WorkoutTemplate; adjustment: string; newDuration: number; skip: boolean }[] {
  // Calculate overall strain from today
  const totalStrain = todayMatches.reduce((sum, m) => sum + m.detected.strain, 0)
  const hasHardWorkout = todayMatches.some(m => m.detected.strain > 14)
  const trainedOnLowRecovery = recoveryScore < 40 && totalStrain > 8
  
  return tomorrowWorkouts.map(workout => {
    let durationMod = 1.0
    let skipWorkout = false
    let adjustmentReason = ""
    
    // High strain today
    if (totalStrain > 18) {
      durationMod *= 0.75
      adjustmentReason = "Reduced due to high strain yesterday"
      if (workout.intensity === "hard") {
        skipWorkout = true
        adjustmentReason = "Skip - need recovery after high strain"
      }
    } else if (totalStrain > 12) {
      durationMod *= 0.9
      adjustmentReason = "Slightly reduced after good training day"
    }
    
    // Trained on low recovery
    if (trainedOnLowRecovery) {
      durationMod *= 0.7
      skipWorkout = workout.intensity === "hard"
      adjustmentReason = skipWorkout 
        ? "Skip - trained on low recovery yesterday" 
        : "Significantly reduced - recovery priority"
    }
    
    // Apply individual workout adjustments
    for (const match of todayMatches) {
      if (match.adjustmentNeeded) {
        if (match.detected.matchedType === workout.type) {
          durationMod *= (100 + match.adjustmentNeeded.durationChange) / 100
          if (match.adjustmentNeeded.skipNextIfHard && workout.intensity === "hard") {
            skipWorkout = true
            adjustmentReason = match.adjustmentNeeded.recommendation
          }
        }
      }
    }
    
    return {
      workout,
      adjustment: adjustmentReason || "No adjustment needed",
      newDuration: Math.round(workout.duration * durationMod),
      skip: skipWorkout,
    }
  })
}
