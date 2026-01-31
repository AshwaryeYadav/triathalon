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
    console.log("GET /api/whoop - checking configuration")
    
    // Check if Whoop is configured
    if (!isWhoopConfigured()) {
      console.log("Whoop not configured")
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop API not configured. Add WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET.",
      })
    }

    // Get tokens from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("whoop_access_token")?.value
    const refreshToken = cookieStore.get("whoop_refresh_token")?.value

    console.log("Tokens from cookies:", { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    })

    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop not connected. Click 'Connect WHOOP' to sync your data.",
      })
    }

    // Try to get real data
    try {
      console.log("Fetching Whoop data with access token")
      const data = await getTodaysWhoopData(accessToken)
      console.log("Successfully fetched Whoop data")

      return NextResponse.json({
        connected: true,
        demo: false,
        data,
        lastSync: new Date().toISOString(),
      })
    } catch (apiError: any) {
      console.error("Whoop API error:", apiError.message || apiError)

      // Try to refresh token
      if (refreshToken) {
        try {
          console.log("Attempting to refresh token")
          const newTokens = await refreshWhoopToken(refreshToken)
          const data = await getTodaysWhoopData(newTokens.accessToken)

          // Update cookies with new tokens
          const response = NextResponse.json({
            connected: true,
            demo: false,
            data,
            lastSync: new Date().toISOString(),
          })

          response.cookies.set("whoop_access_token", newTokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          })

          response.cookies.set("whoop_refresh_token", newTokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          })

          console.log("Token refresh successful")
          return response
        } catch (refreshError: any) {
          console.error("Failed to refresh Whoop token:", refreshError.message || refreshError)
        }
      }

      // Fall back to mock data
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: `Whoop sync failed: ${apiError.message || 'Unknown error'}. Using demo data.`,
      })
    }
  } catch (error: any) {
    console.error("Error in Whoop API:", error.message || error)
    return NextResponse.json({
      connected: false,
      demo: true,
      data: getMockWhoopData(),
      message: `Error: ${error.message || 'Unknown error'}`,
    })
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
