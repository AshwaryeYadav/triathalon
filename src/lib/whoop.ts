// Whoop API Integration
// Documentation: https://developer.whoop.com/docs/developing/user-data/cycle
// Using API v2 (v1 has been deprecated)

// Whoop API endpoints - Using v2
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2"
const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"

export interface WhoopTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

// v2 Recovery data model
export interface WhoopRecovery {
  cycle_id: number
  sleep_id: number
  user_id: number
  created_at: string
  updated_at: string
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE"
  score: {
    user_calibrating: boolean
    recovery_score: number
    resting_heart_rate: number
    hrv_rmssd_milli: number
    spo2_percentage: number | null
    skin_temp_celsius: number | null
  } | null
}

// v2 Cycle data model (from docs)
export interface WhoopCycle {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  start: string
  end: string | null
  timezone_offset: string
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE"
  score: {
    strain: number
    kilojoule: number
    average_heart_rate: number
    max_heart_rate: number
  } | null
}

// v2 Sleep data model
export interface WhoopSleep {
  id: number
  user_id: number
  created_at: string
  updated_at: string
  start: string
  end: string
  timezone_offset: string
  nap: boolean
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE"
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

// Generic fetch helper with full response logging
async function whoopFetch(url: string, accessToken: string, endpoint: string): Promise<any> {
  console.log(`[Whoop ${endpoint}] Fetching: ${url}`)
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const responseText = await response.text()
  console.log(`[Whoop ${endpoint}] Status: ${response.status}`)
  console.log(`[Whoop ${endpoint}] Response: ${responseText.slice(0, 1000)}`)

  if (!response.ok) {
    throw new Error(`Whoop ${endpoint} failed: ${response.status} - ${responseText.slice(0, 200)}`)
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

// v2 API: Fetch recovery data
// Endpoint: GET /v2/recovery
export async function getWhoopRecovery(
  accessToken: string,
  limit: number = 10
): Promise<WhoopRecovery[]> {
  const url = `${WHOOP_API_BASE}/recovery?limit=${limit}`
  const data = await whoopFetch(url, accessToken, "Recovery")
  return data.records || data || []
}

// v2 API: Fetch cycle (strain) data  
// Endpoint: GET /v2/cycle
export async function getWhoopCycles(
  accessToken: string,
  limit: number = 10
): Promise<WhoopCycle[]> {
  const url = `${WHOOP_API_BASE}/cycle?limit=${limit}`
  const data = await whoopFetch(url, accessToken, "Cycle")
  return data.records || data || []
}

// v2 API: Fetch sleep data
// Endpoint: GET /v2/activity/sleep
export async function getWhoopSleep(
  accessToken: string,
  limit: number = 10
): Promise<WhoopSleep[]> {
  const url = `${WHOOP_API_BASE}/activity/sleep?limit=${limit}`
  const data = await whoopFetch(url, accessToken, "Sleep")
  return data.records || data || []
}

// Get all Whoop data
export async function getTodaysWhoopData(accessToken: string) {
  let recoveryRecords: WhoopRecovery[] = []
  let cycleRecords: WhoopCycle[] = []
  let sleepRecords: WhoopSleep[] = []
  let errors: string[] = []

  try {
    recoveryRecords = await getWhoopRecovery(accessToken, 5)
    console.log(`Found ${recoveryRecords.length} recovery records`)
  } catch (e: any) {
    console.log("Could not fetch recovery:", e.message)
    errors.push(`Recovery: ${e.message}`)
  }

  try {
    cycleRecords = await getWhoopCycles(accessToken, 3)
    console.log(`Found ${cycleRecords.length} cycle records`)
  } catch (e: any) {
    console.log("Could not fetch cycles:", e.message)
    errors.push(`Cycle: ${e.message}`)
  }

  try {
    sleepRecords = await getWhoopSleep(accessToken, 5)
    console.log(`Found ${sleepRecords.length} sleep records`)
  } catch (e: any) {
    console.log("Could not fetch sleep:", e.message)
    errors.push(`Sleep: ${e.message}`)
  }

  // Get the most recent SCORED data
  const latestRecovery = recoveryRecords.find(r => r.score_state === "SCORED") || recoveryRecords[0]
  const latestCycle = cycleRecords.find(c => c.score_state === "SCORED") || cycleRecords[0]
  const latestSleep = sleepRecords.find(s => s.score_state === "SCORED" && !s.nap) || sleepRecords[0]

  const recovery = latestRecovery?.score
  const cycle = latestCycle?.score
  const sleep = latestSleep?.score

  console.log("Latest recovery record:", JSON.stringify(latestRecovery))
  console.log("Latest cycle record:", JSON.stringify(latestCycle))
  console.log("Latest sleep record:", JSON.stringify(latestSleep))

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
    _debug: {
      apiVersion: "v2",
      hasRecovery: !!recovery,
      hasCycle: !!cycle,
      hasSleep: !!sleep,
      recoveryCount: recoveryRecords.length,
      cycleCount: cycleRecords.length,
      sleepCount: sleepRecords.length,
      rawRecoveryScore: recovery?.recovery_score ?? null,
      rawHrv: recovery?.hrv_rmssd_milli ?? null,
      rawRestingHR: recovery?.resting_heart_rate ?? null,
      recoveryScoreState: latestRecovery?.score_state ?? null,
      sleepScoreState: latestSleep?.score_state ?? null,
      errors: errors.length > 0 ? errors : null,
    }
  }

  console.log("Final result:", JSON.stringify(result))
  return result
}

// Get historical Whoop data (last 7 days)
export async function getHistoricalWhoopData(accessToken: string, days: number = 7) {
  try {
    const recoveries = await getWhoopRecovery(accessToken, days)

    return recoveries
      .filter(r => r.score_state === "SCORED")
      .map((r) => ({
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
  const mockRecoveryScore = Math.floor(Math.random() * 40) + 50

  return {
    recovery: {
      score: mockRecoveryScore,
      hrv: Math.floor(Math.random() * 30) + 40,
      restingHR: Math.floor(Math.random() * 15) + 50,
      sleepPerformance: Math.floor(Math.random() * 20) + 70,
      spo2: 98,
      skinTemp: null,
    },
    strain: {
      dayStrain: Math.random() * 8 + 4,
      calories: Math.floor(Math.random() * 500) + 2000,
      averageHR: Math.floor(Math.random() * 20) + 80,
      maxHR: Math.floor(Math.random() * 30) + 150,
    },
    sleep: {
      duration: Math.floor(Math.random() * 120) + 360,
      efficiency: Math.floor(Math.random() * 15) + 80,
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
      apiVersion: "v2 (demo)",
      hasRecovery: false,
      hasCycle: false,
      hasSleep: false,
      recoveryCount: 0,
      cycleCount: 0,
      sleepCount: 0,
      rawRecoveryScore: null,
      rawHrv: null,
      rawRestingHR: null,
      recoveryScoreState: null,
      sleepScoreState: null,
      errors: null,
    }
  }
}

// Check if Whoop credentials are configured
export function isWhoopConfigured(): boolean {
  return !!(process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET)
}
