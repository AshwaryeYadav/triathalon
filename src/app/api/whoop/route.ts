import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getMockWhoopData,
  getTodaysWhoopData,
  getHistoricalWhoopData,
  isWhoopConfigured,
  refreshWhoopToken,
} from "@/lib/whoop"
import prisma from "@/lib/prisma"

// GET /api/whoop - Get Whoop data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Whoop is configured
    if (!isWhoopConfigured()) {
      // Return mock data if Whoop is not configured
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop API not configured. Using demo data.",
      })
    }

    // Get user with Whoop tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        whoopAccessToken: true,
        whoopRefreshToken: true,
        whoopUserId: true,
      },
    })

    if (!user?.whoopAccessToken) {
      // User hasn't connected Whoop yet
      return NextResponse.json({
        connected: false,
        demo: true,
        data: getMockWhoopData(),
        message: "Whoop not connected. Using demo data.",
      })
    }

    let accessToken = user.whoopAccessToken

    // Try to get real data
    try {
      const searchParams = request.nextUrl.searchParams
      const historical = searchParams.get("historical") === "true"

      if (historical) {
        const data = await getHistoricalWhoopData(accessToken)
        return NextResponse.json({
          connected: true,
          demo: false,
          data,
          lastSync: new Date().toISOString(),
        })
      }

      const data = await getTodaysWhoopData(accessToken)

      // Save to database
      await prisma.whoopData.upsert({
        where: {
          userId_date: {
            userId: session.user.id,
            date: new Date(new Date().toDateString()), // Normalize to date only
          },
        },
        update: {
          recoveryScore: data.recovery.score,
          hrvRmssd: data.recovery.hrv,
          restingHeartRate: data.recovery.restingHR,
          sleepPerformance: data.recovery.sleepPerformance,
          dayStrain: data.strain.dayStrain,
          averageHeartRate: data.strain.averageHR,
          maxHeartRate: data.strain.maxHR,
          calories: data.strain.calories,
          sleepDuration: data.sleep.duration,
          sleepEfficiency: data.sleep.efficiency,
        },
        create: {
          userId: session.user.id,
          date: new Date(new Date().toDateString()),
          recoveryScore: data.recovery.score,
          hrvRmssd: data.recovery.hrv,
          restingHeartRate: data.recovery.restingHR,
          sleepPerformance: data.recovery.sleepPerformance,
          dayStrain: data.strain.dayStrain,
          averageHeartRate: data.strain.averageHR,
          maxHeartRate: data.strain.maxHR,
          calories: data.strain.calories,
          sleepDuration: data.sleep.duration,
          sleepEfficiency: data.sleep.efficiency,
        },
      })

      return NextResponse.json({
        connected: true,
        demo: false,
        data,
        lastSync: new Date().toISOString(),
      })
    } catch (apiError) {
      console.error("Whoop API error:", apiError)

      // Try to refresh token
      if (user.whoopRefreshToken) {
        try {
          const newTokens = await refreshWhoopToken(user.whoopRefreshToken)

          // Update tokens in database
          await prisma.user.update({
            where: { id: session.user.id },
            data: {
              whoopAccessToken: newTokens.accessToken,
              whoopRefreshToken: newTokens.refreshToken,
            },
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

      // Fall back to cached data or mock
      const cachedData = await prisma.whoopData.findFirst({
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
      })

      if (cachedData) {
        return NextResponse.json({
          connected: true,
          demo: false,
          cached: true,
          data: {
            recovery: {
              score: cachedData.recoveryScore || 0,
              hrv: cachedData.hrvRmssd || 0,
              restingHR: cachedData.restingHeartRate || 0,
              sleepPerformance: cachedData.sleepPerformance || 0,
            },
            strain: {
              dayStrain: cachedData.dayStrain || 0,
              calories: cachedData.calories || 0,
              averageHR: cachedData.averageHeartRate || 0,
            },
            sleep: {
              duration: cachedData.sleepDuration || 0,
              efficiency: cachedData.sleepEfficiency || 0,
            },
            lastUpdated: cachedData.createdAt.toISOString(),
          },
          message: "Using cached data. Whoop sync failed.",
        })
      }

      // No cached data, return mock
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

// POST /api/whoop - Disconnect Whoop
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        whoopAccessToken: null,
        whoopRefreshToken: null,
        whoopUserId: null,
      },
    })

    return NextResponse.json({ success: true, message: "Whoop disconnected" })
  } catch (error) {
    console.error("Error disconnecting Whoop:", error)
    return NextResponse.json(
      { error: "Failed to disconnect Whoop" },
      { status: 500 }
    )
  }
}
