import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaClient = prisma as any;
    
    // Try to create a team to test if the table exists
    let teamCreated = false;
    let teamError = null;
    
    try {
      const testTeam = await prismaClient.team.create({
        data: {
          id: 'test-migration-' + Date.now(),
          name: 'Test Team',
          description: 'Migration test team',
          color: '#FF0000'
        }
      });
      
      // Delete the test team
      await prismaClient.team.delete({
        where: { id: testTeam.id }
      });
      
      teamCreated = true;
    } catch (error) {
      teamError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Try to update a user with teamId to test if the column exists
    let teamIdColumnWorks = false;
    let teamIdError = null;
    
    try {
      // Get the first user
      const users = await prismaClient.user.findMany({ take: 1 });
      if (users.length > 0) {
        await prismaClient.user.update({
          where: { id: users[0].id },
          data: { teamId: null }
        });
        teamIdColumnWorks = true;
      }
    } catch (error) {
      teamIdError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Try to create a bozo stat to test if the table exists
    let bozoStatCreated = false;
    let bozoStatError = null;
    
    try {
      const testBozoStat = await prismaClient.bozoStat.create({
        data: {
          id: 'test-bozo-' + Date.now(),
          userId: 'test-user',
          week: 1,
          season: 2025,
          isBiggestBozo: false,
          odds: 1.5,
          prop: 'Test prop'
        }
      });
      
      // Delete the test bozo stat
      await prismaClient.bozoStat.delete({
        where: { id: testBozoStat.id }
      });
      
      bozoStatCreated = true;
    } catch (error) {
      bozoStatError = error instanceof Error ? error.message : 'Unknown error';
    }

    const allWorking = teamCreated && teamIdColumnWorks && bozoStatCreated;

    return NextResponse.json({
      success: true,
      message: allWorking ? 'Database schema is working correctly' : 'Database schema has issues',
      details: {
        teamTable: {
          working: teamCreated,
          error: teamError
        },
        teamIdColumn: {
          working: teamIdColumnWorks,
          error: teamIdError
        },
        bozoStatTable: {
          working: bozoStatCreated,
          error: bozoStatError
        }
      },
      allWorking
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
