import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to remove team assignment from all users
    // Handle case where teamId field might not exist in database yet
    try {
      await prisma.user.updateMany({
        where: { teamId: id },
        data: { teamId: null }
      })
    } catch (teamIdError) {
      console.log('teamId field not available in database yet:', teamIdError)
      // Continue with team deletion even if teamId field doesn't exist
    }

    // Delete the team
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).team?.delete({
        where: { id }
      })
    } catch (teamError) {
      console.log('Team table not available yet:', teamError)
      return NextResponse.json({ error: 'Team management not available yet. Please update database schema.' }, { status: 503 })
    }

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
