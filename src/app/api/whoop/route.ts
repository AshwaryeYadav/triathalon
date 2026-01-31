import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getMockWhoopData,
  getTodaysWhoopData,
  isWhoopConfigured,
  refreshWhoopToken,
} from "@/lib/whoop"

// In-memory storage for demo (resets on redeploy)
const whoopTokens = new Map<string, { accessToken: string; refreshToken: string }>()

// GET /api/whoop - Get Whoop data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Whoop is configured
    if (!isWhoopConfigured()) {
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop API not configured. Using demo data.",
      })
    }

    // Check if user has Whoop tokens (in-memory for demo)
    const tokens = whoopTokens.get(session.user.id)

    if (!tokens?.accessToken) {
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop not connected. Using demo data.",
      })
    }

    // Try to get real data
    try {
      const data = await getTodaysWhoopData(tokens.accessToken)

      return NextResponse.json({
        connected: true,
        demo: false,
        data,
        lastSync: new Date().toISOString(),
      })
    } catch (apiError) {
      console.error("Whoop API error:", apiError)

      // Try to refresh token
      if (tokens.refreshToken) {
        try {
          const newTokens = await refreshWhoopToken(tokens.refreshToken)
          whoopTokens.set(session.user.id, {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
          })

          // Retry with new token
          const data = await getTodaysWhoopData(newTokens.accessToken)
          return NextResponse.json({
            connected: true,
            demo: false,
            data,
            lastSync: new Date().toISOString(),
          })
        } catch (refreshError) {
          console.error("Failed to refresh Whoop token:", refreshError)
        }
      }

      // Fall back to mock data
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop sync failed. Using demo data.",
      })
    }
  } catch (error) {
    console.error("Error in Whoop API:", error)
    return NextResponse.json(
      { error: "Failed to fetch Whoop data" },
      { status: 500 }
    )
  }
}

// POST /api/whoop - Save Whoop tokens (called after OAuth)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { accessToken, refreshToken } = body

    if (accessToken) {
      whoopTokens.set(session.user.id, { accessToken, refreshToken })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving Whoop tokens:", error)
    return NextResponse.json(
      { error: "Failed to save tokens" },
      { status: 500 }
    )
  }
}

// DELETE /api/whoop - Disconnect Whoop
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    whoopTokens.delete(session.user.id)

    return NextResponse.json({ success: true, message: "Whoop disconnected" })
  } catch (error) {
    console.error("Error disconnecting Whoop:", error)
    return NextResponse.json(
      { error: "Failed to disconnect Whoop" },
      { status: 500 }
    )
  }
}

// Export tokens map for callback route
export { whoopTokens }
