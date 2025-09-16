import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test if we can access the prisma client
    const prismaClient = prisma as any;
    
    // Check if team model exists
    const hasTeamModel = 'team' in prismaClient;
    
    // Try to get the database schema info
    let schemaInfo = {};
    try {
      const result = await prismaClient.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      schemaInfo = { tables: result };
    } catch (error) {
      schemaInfo = { error: 'Could not query schema' };
    }

    // Try to access team model
    let teamTest = null;
    if (hasTeamModel) {
      try {
        teamTest = await prismaClient.team.findMany();
      } catch (error) {
        teamTest = { error: 'Team model exists but query failed' };
      }
    }

    return NextResponse.json({
      success: true,
      hasTeamModel,
      teamTest,
      schemaInfo,
      prismaClientKeys: Object.keys(prismaClient).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
