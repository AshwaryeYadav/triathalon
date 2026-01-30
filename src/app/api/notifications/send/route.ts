import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import prisma from "@/lib/prisma"

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@tricoach.app",
    vapidPublicKey,
    vapidPrivateKey
  )
}

// POST /api/notifications/send - Send a push notification
export async function POST(request: NextRequest) {
  try {
    // This would typically be called by a cron job or scheduler
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, title, message, type = "workout_reminder" } = body

    // Get user with push subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user?.pushSubscription) {
      return NextResponse.json(
        { error: "User has no push subscription" },
        { status: 400 }
      )
    }

    const subscription = JSON.parse(user.pushSubscription)

    // Send the notification
    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        type,
        url: "/",
      },
    })

    await webpush.sendNotification(subscription, payload)

    // Log the notification
    await prisma.notification.create({
      data: {
        userId,
        title,
        body: message,
        type,
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}
