import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection and get basic info
    const userCount = await prisma.user.count();
    const teamCount = await prisma.team.count();
    
    // Test creating and immediately deleting a team
    let testTeam = null;
    let testResult = 'failed';
    
    try {
      testTeam = await prisma.team.create({
        data: {
          id: 'test-connection-' + Date.now(),
          name: 'Connection Test Team',
          description: 'Testing database connection',
          color: '#00FF00'
        }
      });
      
      // Try to fetch it back
      const fetchedTeam = await prisma.team.findUnique({
        where: { id: testTeam.id }
      });
      
      if (fetchedTeam) {
        testResult = 'success';
        // Clean up
        await prisma.team.delete({
          where: { id: testTeam.id }
        });
      }
    } catch (error) {
      testResult = 'error: ' + (error instanceof Error ? error.message : 'Unknown error');
    }

    return NextResponse.json({
      success: true,
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@'),
      userCount,
      teamCount,
      testResult,
      testTeam: testTeam ? {
        id: testTeam.id,
        name: testTeam.name,
        createdAt: testTeam.createdAt
      } : null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@')
    }, { status: 500 });
  }
}
