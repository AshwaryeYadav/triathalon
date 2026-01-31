import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getWhoopAuthUrl, isWhoopConfigured } from "@/lib/whoop"

// GET /api/whoop/connect - Get Whoop OAuth URL
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isWhoopConfigured()) {
      return NextResponse.json(
        { error: "Whoop API not configured" },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const redirectUri = `${baseUrl}/api/whoop/callback`
    const state = session.user.id // Use user ID as state for verification

    const authUrl = getWhoopAuthUrl(redirectUri, state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Error generating Whoop auth URL:", error)
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    )
  }
}
