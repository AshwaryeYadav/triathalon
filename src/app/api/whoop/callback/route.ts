import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeWhoopCode } from "@/lib/whoop"

// GET /api/whoop/callback - OAuth callback from Whoop
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    console.error("Whoop OAuth error:", error)
    return NextResponse.redirect(
      new URL(`/whoop?error=whoop_${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/whoop?error=no_code", request.url)
    )
  }

  // Exchange code for tokens
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
  const redirectUri = `${baseUrl}/api/whoop/callback`

  try {
    const tokens = await exchangeWhoopCode(code, redirectUri)

    // Store tokens in a secure cookie
    const cookieStore = await cookies()
    
    cookieStore.set("whoop_access_token", tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    cookieStore.set("whoop_refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return NextResponse.redirect(
      new URL("/whoop?connected=true", request.url)
    )
  } catch (tokenError) {
    console.error("Error exchanging Whoop code:", tokenError)
    return NextResponse.redirect(
      new URL("/whoop?error=token_failed", request.url)
    )
  }
}
