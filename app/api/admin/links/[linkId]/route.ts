import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionAddress } from '@/lib/auth'

/**
 * PATCH /api/admin/links/[linkId]
 * Update link (enabled status, title, or URL)
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
        const { enabled, title, url } = body

        // Build update data object dynamically
        const updateData: any = {}

        if (typeof enabled === 'boolean') {
            updateData.enabled = enabled
        }

        if (typeof title === 'string') {
            updateData.title = title.trim()
        }

        if (typeof url === 'string') {
            const trimmedUrl = url.trim()
            if (!trimmedUrl) {
                return NextResponse.json({ error: 'URL cannot be empty' }, { status: 400 })
            }
            updateData.url = trimmedUrl
        }

        // At least one field must be provided
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'At least one field (enabled, title, url) must be provided' },
                { status: 400 }
            )
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
            data: updateData,
        })

        // Log admin action
        try {
            // Determine what was changed for audit log
            const changes = []
            if ('enabled' in updateData) changes.push(updateData.enabled ? 'enabled' : 'disabled')
            if ('title' in updateData) changes.push('title')
            if ('url' in updateData) changes.push('url')

            await prisma.adminAuditLog.create({
                data: {
                    adminAddress: sessionAddress.toLowerCase(),
                    action: changes.length > 0 ? `update_link_${changes.join('_')}` : 'update_link',
                    targetType: 'link',
                    targetId: link.id,
                    metadata: JSON.stringify({
                        linkTitle: link.title,
                        linkUrl: link.url,
                        profileAddress: existingLink.profile.address,
                        changes: updateData,
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
