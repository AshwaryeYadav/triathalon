// Whoop API Integration
// Documentation: https://developer.whoop.com/

// Whoop API endpoints (v1)
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v1"
const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"

export interface WhoopTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface WhoopRecovery {
  cycle_id: number
  sleep_id: number
  user_id: number
  created_at: string
  updated_at: string
  score_state: string
  score: {
    user_calibrating: boolean
    recovery_score: number
    resting_heart_rate: number
    hrv_rmssd_milli: number
    spo2_percentage: number | null
    skin_temp_celsius: number | null
  }
}

export interface WhoopCycle {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  start: string
  end: string | null
  timezone_offset: string
  score_state: string
  score: {
    strain: number
    kilojoule: number
    average_heart_rate: number
    max_heart_rate: number
  } | null
}

export interface WhoopSleep {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  start: string
  end: string
  timezone_offset: string
  nap: boolean
  score_state: string
  score: {
    stage_summary: {
      total_in_bed_time_milli: number
      total_awake_time_milli: number
      total_no_data_time_milli: number
      total_light_sleep_time_milli: number
      total_slow_wave_sleep_time_milli: number
      total_rem_sleep_time_milli: number
      sleep_cycle_count: number
      disturbance_count: number
    }
    sleep_needed: {
      baseline_milli: number
      need_from_sleep_debt_milli: number
      need_from_recent_strain_milli: number
      need_from_recent_nap_milli: number
    }
    respiratory_rate: number
    sleep_performance_percentage: number
    sleep_consistency_percentage: number
    sleep_efficiency_percentage: number
  } | null
}

export interface WhoopProfile {
  user_id: number
  email: string
  first_name: string
  last_name: string
}

// Generate OAuth authorization URL
export function getWhoopAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.WHOOP_CLIENT_ID
  if (!clientId) throw new Error("WHOOP_CLIENT_ID not configured")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read:recovery read:cycles read:sleep read:profile offline",
    state: state || generateState(),
  })

  return `${WHOOP_AUTH_URL}?${params.toString()}`
}

// Exchange authorization code for tokens
export async function exchangeWhoopCode(
  code: string,
  redirectUri: string
): Promise<WhoopTokens> {
  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Whoop credentials not configured")
  }

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Whoop token exchange failed: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// Refresh access token
export async function refreshWhoopToken(
  refreshToken: string
): Promise<WhoopTokens> {
  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Whoop credentials not configured")
  }

  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Whoop token refresh failed: ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// Fetch user profile
export async function getWhoopProfile(
  accessToken: string
): Promise<WhoopProfile> {
  const response = await fetch(`${WHOOP_API_BASE}/user/profile/basic`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop profile: ${response.statusText}`)
  }

  return response.json()
}

// Fetch recovery data for a date range
export async function getWhoopRecovery(
  accessToken: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 7
): Promise<WhoopRecovery[]> {
  const params = new URLSearchParams({
    limit: String(limit),
  })

  if (startDate) {
    params.append("start", startDate.toISOString())
  }
  if (endDate) {
    params.append("end", endDate.toISOString())
  }

  const url = `${WHOOP_API_BASE}/recovery?${params.toString()}`
  console.log("Fetching Whoop recovery from:", url)
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Whoop recovery error:", response.status, errorText)
    throw new Error(`Failed to fetch Whoop recovery: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log("Whoop recovery RAW response:", JSON.stringify(data))
  return data.records || data || []
}

// Fetch latest recovery score
export async function getLatestRecovery(
  accessToken: string
): Promise<WhoopRecovery | null> {
  const recoveries = await getWhoopRecovery(accessToken, undefined, undefined, 1)
  console.log("Latest recovery parsed:", JSON.stringify(recoveries[0] || null))
  return recoveries[0] || null
}

// Fetch cycle (strain) data
export async function getWhoopCycles(
  accessToken: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 7
): Promise<WhoopCycle[]> {
  const params = new URLSearchParams({
    limit: String(limit),
  })

  if (startDate) {
    params.append("start", startDate.toISOString())
  }
  if (endDate) {
    params.append("end", endDate.toISOString())
  }

  const url = `${WHOOP_API_BASE}/cycle?${params.toString()}`
  console.log("Fetching Whoop cycles from:", url)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Whoop cycles error:", response.status, errorText)
    throw new Error(`Failed to fetch Whoop cycles: ${response.statusText}`)
  }

  const data = await response.json()
  console.log("Whoop cycles RAW response:", JSON.stringify(data))
  return data.records || []
}

// Fetch sleep data
export async function getWhoopSleep(
  accessToken: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 7
): Promise<WhoopSleep[]> {
  const params = new URLSearchParams({
    limit: String(limit),
  })

  if (startDate) {
    params.append("start", startDate.toISOString())
  }
  if (endDate) {
    params.append("end", endDate.toISOString())
  }

  const url = `${WHOOP_API_BASE}/activity/sleep?${params.toString()}`
  console.log("Fetching Whoop sleep from:", url)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Whoop sleep error:", response.status, errorText)
    throw new Error(`Failed to fetch Whoop sleep: ${response.statusText}`)
  }

  const data = await response.json()
  console.log("Whoop sleep RAW response:", JSON.stringify(data))
  return data.records || []
}

// Get all Whoop data for today
export async function getTodaysWhoopData(accessToken: string) {
  // Try to fetch data, but handle 404s gracefully (no data yet)
  let recoveryData = null
  let cycleData: WhoopCycle[] = []
  let sleepData: WhoopSleep[] = []

  // Get date range for last 3 days to ensure we capture recent data
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 3)

  try {
    // Fetch more records to find the most recent one
    const recoveries = await getWhoopRecovery(accessToken, startDate, endDate, 5)
    recoveryData = recoveries[0] || null
    console.log(`Found ${recoveries.length} recovery records`)
  } catch (e: any) {
    console.log("Could not fetch recovery:", e.message)
  }

  try {
    // Get latest cycle - don't filter by date since current cycle might not have end date
    cycleData = await getWhoopCycles(accessToken, undefined, undefined, 1)
  } catch (e: any) {
    console.log("Could not fetch cycles:", e.message)
  }

  try {
    // Fetch recent sleep data
    sleepData = await getWhoopSleep(accessToken, startDate, endDate, 5)
    console.log(`Found ${sleepData.length} sleep records`)
  } catch (e: any) {
    console.log("Could not fetch sleep:", e.message)
  }

  // Extract the nested score objects
  const recovery = recoveryData?.score
  const cycle = cycleData[0]?.score
  const sleep = sleepData[0]?.score

  console.log("Extracted recovery score:", JSON.stringify(recovery))
  console.log("Extracted cycle score:", JSON.stringify(cycle))
  console.log("Extracted sleep score:", JSON.stringify(sleep))

  // HRV from Whoop is in milliseconds (hrv_rmssd_milli) - typically 20-100ms
  // Resting HR is in bpm - typically 40-80
  // Recovery score is 0-100
  
  const result = {
    recovery: {
      score: Math.round(recovery?.recovery_score ?? 0),
      hrv: Math.round(recovery?.hrv_rmssd_milli ?? 0),
      restingHR: Math.round(recovery?.resting_heart_rate ?? 0),
      sleepPerformance: Math.round(sleep?.sleep_performance_percentage ?? 0),
      spo2: recovery?.spo2_percentage ?? null,
      skinTemp: recovery?.skin_temp_celsius ?? null,
    },
    strain: {
      dayStrain: cycle?.strain ?? 0,
      calories: cycle?.kilojoule ? Math.round(cycle.kilojoule * 0.239) : 0,
      averageHR: Math.round(cycle?.average_heart_rate ?? 0),
      maxHR: Math.round(cycle?.max_heart_rate ?? 0),
    },
    sleep: {
      duration: sleep?.stage_summary
        ? Math.round(
            (sleep.stage_summary.total_in_bed_time_milli -
              sleep.stage_summary.total_awake_time_milli) /
              60000
          )
        : 0,
      efficiency: Math.round(sleep?.sleep_efficiency_percentage ?? 0),
      consistency: Math.round(sleep?.sleep_consistency_percentage ?? 0),
      respiratoryRate: sleep?.respiratory_rate ?? null,
      lightSleep: sleep?.stage_summary 
        ? Math.round(sleep.stage_summary.total_light_sleep_time_milli / 60000) 
        : 0,
      deepSleep: sleep?.stage_summary 
        ? Math.round(sleep.stage_summary.total_slow_wave_sleep_time_milli / 60000) 
        : 0,
      remSleep: sleep?.stage_summary 
        ? Math.round(sleep.stage_summary.total_rem_sleep_time_milli / 60000) 
        : 0,
      disturbances: sleep?.stage_summary?.disturbance_count ?? 0,
    },
    lastUpdated: new Date().toISOString(),
    hasData: !!(recovery || cycle || sleep),
    // Debug info
    _debug: {
      hasRecovery: !!recovery,
      hasCycle: !!cycle,
      hasSleep: !!sleep,
      rawRecoveryScore: recovery?.recovery_score ?? null,
      rawHrv: recovery?.hrv_rmssd_milli ?? null,
      rawRestingHR: recovery?.resting_heart_rate ?? null,
      recoveryScoreState: recoveryData?.score_state ?? null,
      sleepScoreState: sleepData[0]?.score_state ?? null,
    }
  }

  console.log("Final Whoop data result:", JSON.stringify(result))
  return result
}

// Get historical Whoop data (last 7 days)
export async function getHistoricalWhoopData(accessToken: string, days: number = 7) {
  try {
    const recoveries = await getWhoopRecovery(accessToken, undefined, undefined, days)

    return recoveries.map((r) => ({
      date: r.created_at,
      recovery: {
        score: Math.round(r.score?.recovery_score ?? 0),
        hrv: Math.round(r.score?.hrv_rmssd_milli ?? 0),
        restingHR: Math.round(r.score?.resting_heart_rate ?? 0),
      },
    }))
  } catch (error) {
    console.error("Error fetching historical Whoop data:", error)
    throw error
  }
}

// Helper to generate random state for OAuth
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
}

// Mock data for demo mode (when Whoop is not connected)
export function getMockWhoopData() {
  const today = new Date()
  const mockRecoveryScore = Math.floor(Math.random() * 40) + 50 // 50-90 range

  return {
    recovery: {
      score: mockRecoveryScore,
      hrv: Math.floor(Math.random() * 30) + 40, // 40-70 ms
      restingHR: Math.floor(Math.random() * 15) + 50, // 50-65 bpm
      sleepPerformance: Math.floor(Math.random() * 20) + 70, // 70-90%
      spo2: 98,
      skinTemp: null,
    },
    strain: {
      dayStrain: Math.random() * 8 + 4, // 4-12
      calories: Math.floor(Math.random() * 500) + 2000,
      averageHR: Math.floor(Math.random() * 20) + 80,
      maxHR: Math.floor(Math.random() * 30) + 150,
    },
    sleep: {
      duration: Math.floor(Math.random() * 120) + 360, // 6-8 hours in minutes
      efficiency: Math.floor(Math.random() * 15) + 80, // 80-95%
      consistency: Math.floor(Math.random() * 20) + 70,
      respiratoryRate: 14 + Math.random() * 2,
      lightSleep: Math.floor(Math.random() * 60) + 120,
      deepSleep: Math.floor(Math.random() * 30) + 60,
      remSleep: Math.floor(Math.random() * 30) + 60,
      disturbances: Math.floor(Math.random() * 5),
    },
    lastUpdated: today.toISOString(),
    hasData: false,
    _debug: {
      hasRecovery: false,
      hasCycle: false,
      hasSleep: false,
      rawRecoveryScore: null,
      rawHrv: null,
      rawRestingHR: null,
    }
  }
}

// Check if Whoop credentials are configured
export function isWhoopConfigured(): boolean {
  return !!(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET)
}
