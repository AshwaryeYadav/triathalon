import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { exchangeWhoopCode, getWhoopProfile } from "@/lib/whoop"
import prisma from "@/lib/prisma"

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

    if (error) {
      console.error("Whoop OAuth error:", error)
      return NextResponse.redirect(
        new URL("/settings?error=whoop_auth_failed", request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=no_code", request.url)
      )
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/whoop/callback`
    const tokens = await exchangeWhoopCode(code, redirectUri)

    // Get user profile
    const profile = await getWhoopProfile(tokens.accessToken)

    // Save tokens to user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        whoopAccessToken: tokens.accessToken,
        whoopRefreshToken: tokens.refreshToken,
        whoopUserId: String(profile.user_id),
      },
    })

    return NextResponse.redirect(new URL("/whoop?connected=true", request.url))
  } catch (error) {
    console.error("Error in Whoop callback:", error)
    return NextResponse.redirect(
      new URL("/settings?error=whoop_callback_failed", request.url)
    )
  }
}
