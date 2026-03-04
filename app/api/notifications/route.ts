import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const address = searchParams.get("address")?.toLowerCase()

        if (!address) {
            return NextResponse.json(
                { error: "Address is required" },
                { status: 400 }
            )
        }

        const notifications = await (prisma as any).notification.findMany({
            where: {
                profileId: address,
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        })

        const unreadCount = notifications.filter((n: any) => !n.isRead).length

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const address = searchParams.get("address")?.toLowerCase()

        if (!address) {
            return NextResponse.json(
                { error: "Address is required" },
                { status: 400 }
            )
        }

        // Check for specific notification ID, otherwise mark all as read
        const body = await request.json().catch(() => ({}))
        const notificationId = body.id

        if (notificationId) {
            await (prisma as any).notification.updateMany({
                where: {
                    id: notificationId,
                    profileId: address,
                },
                data: {
                    isRead: true
                }
            })
        } else {
            // Mark all as read
            await (prisma as any).notification.updateMany({
                where: {
                    profileId: address,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating notifications:", error)
        return NextResponse.json(
            { error: "Failed to update notifications" },
            { status: 500 }
        )
    }
}
