import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'

/**
 * PATCH /api/admin/links/[linkId]
 * Toggle link enabled/disabled status
 * Requires admin authorization
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { linkId: string } }
) {
    try {
        // Authorization: Check admin session
        const sessionAddress = await getSessionAddress()
        if (!sessionAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const profile = await prisma.profile.findUnique({
            where: { address: sessionAddress.toLowerCase() },
        })

        if (!profile || profile.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        // Validate linkId
        if (!params.linkId) {
            return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
        }

        // Parse request body
        const body = await request.json()
        const { enabled } = body

        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'enabled field must be boolean' }, { status: 400 })
        }

        // Check if link exists
        const existingLink = await prisma.profileLink.findUnique({
            where: { id: params.linkId },
            include: { profile: true },
        })

        if (!existingLink) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 })
        }

        // Update link
        const link = await prisma.profileLink.update({
            where: { id: params.linkId },
            data: { enabled },
        })

        // Log admin action
        try {
            await prisma.adminAuditLog.create({
                data: {
                    adminAddress: sessionAddress.toLowerCase(),
                    action: enabled ? 'enable_link' : 'disable_link',
                    targetType: 'link',
                    targetId: link.id,
                    metadata: JSON.stringify({
                        linkTitle: link.title,
                        linkUrl: link.url,
                        profileAddress: existingLink.profile.address,
                    }),
                },
            })
        } catch (auditError) {
            // Log but don't fail the request if audit log fails
            console.error('[Admin] Failed to create audit log:', auditError)
        }

        return NextResponse.json({ success: true, link })
    } catch (error: any) {
        console.error('[Admin] Error toggling link:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/links/[linkId]
 * Permanently delete a link
 * Requires admin authorization
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { linkId: string } }
) {
    try {
        // Authorization: Check admin session
        const sessionAddress = await getSessionAddress()
        if (!sessionAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const profile = await prisma.profile.findUnique({
            where: { address: sessionAddress.toLowerCase() },
        })

        if (!profile || profile.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        // Validate linkId
        if (!params.linkId) {
            return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
        }

        // Get link info before deleting (for audit log)
        const link = await prisma.profileLink.findUnique({
            where: { id: params.linkId },
            include: { profile: true },
        })

        if (!link) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 })
        }

        // Delete link
        await prisma.profileLink.delete({
            where: { id: params.linkId },
        })

        // Log admin action
        try {
            await prisma.adminAuditLog.create({
                data: {
                    adminAddress: sessionAddress.toLowerCase(),
                    action: 'delete_link',
                    targetType: 'link',
                    targetId: link.id,
                    metadata: JSON.stringify({
                        profileAddress: link.profile.address,
                        linkTitle: link.title,
                        linkUrl: link.url,
                        profileDisplayName: link.profile.displayName,
                    }),
                },
            })
        } catch (auditError) {
            // Log but don't fail the request if audit log fails
            console.error('[Admin] Failed to create audit log:', auditError)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Admin] Error deleting link:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}
