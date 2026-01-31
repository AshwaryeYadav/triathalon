import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeWhoopCode } from "@/lib/whoop"

// GET /api/whoop/callback - OAuth callback from Whoop
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("Whoop callback received:", { 
    hasCode: !!code, 
    error, 
    errorDescription,
    url: request.url 
  })

  if (error) {
    console.error("Whoop OAuth error:", error, errorDescription)
    return NextResponse.redirect(
      new URL(`/whoop?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || '')}`, request.url)
    )
  }

  if (!code) {
    console.error("No code in Whoop callback")
    return NextResponse.redirect(
      new URL("/whoop?error=no_code", request.url)
    )
  }

  // Exchange code for tokens
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
  const redirectUri = `${baseUrl}/api/whoop/callback`
  
  console.log("Exchanging code with redirect URI:", redirectUri)

  try {
    const tokens = await exchangeWhoopCode(code, redirectUri)
    
    console.log("Got tokens, storing in cookies")

    // Store tokens in a secure cookie
    const cookieStore = await cookies()
    
    cookieStore.set("whoop_access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    cookieStore.set("whoop_refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    console.log("Tokens stored successfully, redirecting to /whoop")

    return NextResponse.redirect(
      new URL("/whoop?connected=true", request.url)
    )
  } catch (tokenError: any) {
    console.error("Error exchanging Whoop code:", tokenError.message || tokenError)
    return NextResponse.redirect(
      new URL(`/whoop?error=token_failed&message=${encodeURIComponent(tokenError.message || 'Unknown error')}`, request.url)
    )
  }
}
