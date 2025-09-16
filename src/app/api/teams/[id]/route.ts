import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Remove team assignment from all users
    await prisma.user.updateMany({
      where: { teamId: id },
      data: { teamId: null }
    })

    // Delete the team
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).team?.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
