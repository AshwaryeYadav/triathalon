import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exchangeWhoopCode, getWhoopProfile } from "@/lib/whoop"

// In-memory storage (same as main route)
const whoopTokens = new Map<string, { accessToken: string; refreshToken: string }>()

// GET /api/whoop/callback - OAuth callback from Whoop
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    const state = searchParams.get("state")

    if (error) {
      console.error("Whoop OAuth error:", error)
      return NextResponse.redirect(
        new URL(`/settings?error=whoop_${error}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=no_code", request.url)
      )
    }

    // Exchange code for tokens
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const redirectUri = `${baseUrl}/api/whoop/callback`

    try {
      const tokens = await exchangeWhoopCode(code, redirectUri)

      // Store tokens in memory
      whoopTokens.set(session.user.id, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      })

      return NextResponse.redirect(
        new URL("/whoop?connected=true", request.url)
      )
    } catch (tokenError) {
      console.error("Error exchanging Whoop code:", tokenError)
      return NextResponse.redirect(
        new URL("/settings?error=whoop_token_failed", request.url)
      )
    }
  } catch (error) {
    console.error("Error in Whoop callback:", error)
    return NextResponse.redirect(
      new URL("/settings?error=whoop_callback_failed", request.url)
    )
  }
}

// Export for other routes
export { whoopTokens }
