import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getMockWhoopData } from "@/lib/whoop"
import prisma from "@/lib/prisma"

// GET /api/whoop - Get Whoop data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    // For demo mode, return mock data
    const mockData = getMockWhoopData()
    
    return NextResponse.json({
      connected: true,
      data: mockData,
      lastSync: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching Whoop data:", error)
    return NextResponse.json(
      { error: "Failed to fetch Whoop data" },
      { status: 500 }
    )
  }
}

// POST /api/whoop - Save Whoop data
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const whoopData = await prisma.whoopData.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: new Date(body.date),
        },
      },
      update: {
        recoveryScore: body.recovery?.score,
        hrvRmssd: body.recovery?.hrv,
        restingHeartRate: body.recovery?.restingHR,
        sleepPerformance: body.recovery?.sleepPerformance,
        dayStrain: body.strain?.dayStrain,
        averageHeartRate: body.strain?.averageHR,
        calories: body.strain?.calories,
        sleepDuration: body.sleep?.duration,
        sleepEfficiency: body.sleep?.efficiency,
      },
      create: {
        userId: session.user.id,
        date: new Date(body.date),
        recoveryScore: body.recovery?.score,
        hrvRmssd: body.recovery?.hrv,
        restingHeartRate: body.recovery?.restingHR,
        sleepPerformance: body.recovery?.sleepPerformance,
        dayStrain: body.strain?.dayStrain,
        averageHeartRate: body.strain?.averageHR,
        calories: body.strain?.calories,
        sleepDuration: body.sleep?.duration,
        sleepEfficiency: body.sleep?.efficiency,
      },
    })

    return NextResponse.json({ whoopData })
  } catch (error) {
    console.error("Error saving Whoop data:", error)
    return NextResponse.json(
      { error: "Failed to save Whoop data" },
      { status: 500 }
    )
  }
}
