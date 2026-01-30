// Whoop API Integration
// Documentation: https://developer.whoop.com/

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
export function getWhoopAuthUrl(redirectUri: string): string {
  const clientId = process.env.WHOOP_CLIENT_ID
  if (!clientId) throw new Error("WHOOP_CLIENT_ID not configured")
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read:recovery read:cycles read:sleep read:profile offline",
    state: generateState(),
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
    throw new Error(`Whoop token exchange failed: ${response.statusText}`)
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
    throw new Error(`Whoop token refresh failed: ${response.statusText}`)
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
  startDate: Date,
  endDate: Date
): Promise<WhoopRecovery[]> {
  const params = new URLSearchParams({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  })
  
  const response = await fetch(
    `${WHOOP_API_BASE}/recovery?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop recovery: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.records || []
}

// Fetch latest recovery score
export async function getLatestRecovery(
  accessToken: string
): Promise<WhoopRecovery | null> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 1)
  
  const recoveries = await getWhoopRecovery(accessToken, startDate, endDate)
  return recoveries[0] || null
}

// Fetch cycle (strain) data
export async function getWhoopCycles(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<WhoopCycle[]> {
  const params = new URLSearchParams({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  })
  
  const response = await fetch(
    `${WHOOP_API_BASE}/cycle?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop cycles: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.records || []
}

// Fetch sleep data
export async function getWhoopSleep(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<WhoopSleep[]> {
  const params = new URLSearchParams({
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  })
  
  const response = await fetch(
    `${WHOOP_API_BASE}/activity/sleep?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop sleep: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.records || []
}

// Helper to generate random state for OAuth
function generateState(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Mock data for demo mode
export function getMockWhoopData() {
  const today = new Date()
  const mockRecoveryScore = Math.floor(Math.random() * 40) + 50 // 50-90 range
  
  return {
    recovery: {
      score: mockRecoveryScore,
      hrv: Math.floor(Math.random() * 30) + 40, // 40-70 ms
      restingHR: Math.floor(Math.random() * 15) + 50, // 50-65 bpm
      sleepPerformance: Math.floor(Math.random() * 20) + 70, // 70-90%
    },
    strain: {
      dayStrain: Math.random() * 8 + 4, // 4-12
      calories: Math.floor(Math.random() * 500) + 2000,
      averageHR: Math.floor(Math.random() * 20) + 80,
    },
    sleep: {
      duration: Math.floor(Math.random() * 120) + 360, // 6-8 hours in minutes
      efficiency: Math.floor(Math.random() * 15) + 80, // 80-95%
    },
    lastUpdated: today.toISOString(),
  }
}
