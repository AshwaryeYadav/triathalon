import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  getMockWhoopData,
  getTodaysWhoopData,
  isWhoopConfigured,
  refreshWhoopToken,
} from "@/lib/whoop"

// GET /api/whoop - Get Whoop data
export async function GET(request: NextRequest) {
  try {
    // Check if Whoop is configured
    if (!isWhoopConfigured()) {
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop API not configured. Using demo data.",
      })
    }

    // Get tokens from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("whoop_access_token")?.value
    const refreshToken = cookieStore.get("whoop_refresh_token")?.value

    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop not connected. Using demo data.",
      })
    }

    // Try to get real data
    try {
      const data = await getTodaysWhoopData(accessToken)

      return NextResponse.json({
        connected: true,
        demo: false,
        data,
        lastSync: new Date().toISOString(),
      })
    } catch (apiError) {
      console.error("Whoop API error:", apiError)

      // Try to refresh token
      if (refreshToken) {
        try {
          const newTokens = await refreshWhoopToken(refreshToken)

          // Update cookies with new tokens
          const response = NextResponse.json({
            connected: true,
            demo: false,
            data: await getTodaysWhoopData(newTokens.accessToken),
            lastSync: new Date().toISOString(),
          })

          response.cookies.set("whoop_access_token", newTokens.accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          })

          response.cookies.set("whoop_refresh_token", newTokens.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          })

          return response
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

// DELETE /api/whoop - Disconnect Whoop
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: "Whoop disconnected" })

    // Clear the cookies
    response.cookies.delete("whoop_access_token")
    response.cookies.delete("whoop_refresh_token")

    return response
  } catch (error) {
    console.error("Error disconnecting Whoop:", error)
    return NextResponse.json(
      { error: "Failed to disconnect Whoop" },
      { status: 500 }
    )
  }
}
