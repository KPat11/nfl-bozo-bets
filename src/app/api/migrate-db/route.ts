import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const prismaClient = prisma as any;
    
    // Check if team table exists
    const teamTableExists = await prismaClient.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Team'
      );
    `;

    if (!teamTableExists[0]?.exists) {
      // Create the Team table
      await prismaClient.$executeRaw`
        CREATE TABLE "Team" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "color" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
        );
      `;
    }

    // Check if teamId column exists in User table
    const teamIdColumnExists = await prismaClient.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'teamId'
      );
    `;

    if (!teamIdColumnExists[0]?.exists) {
      // Add teamId column to User table
      await prismaClient.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "teamId" TEXT;
      `;
    }

    // Check if totalBozos column exists in User table
    const totalBozosColumnExists = await prismaClient.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'totalBozos'
      );
    `;

    if (!totalBozosColumnExists[0]?.exists) {
      // Add totalBozos column to User table
      await prismaClient.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "totalBozos" INTEGER NOT NULL DEFAULT 0;
      `;
    }

    // Check if totalHits column exists in User table
    const totalHitsColumnExists = await prismaClient.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'User' 
        AND column_name = 'totalHits'
      );
    `;

    if (!totalHitsColumnExists[0]?.exists) {
      // Add totalHits column to User table
      await prismaClient.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "totalHits" INTEGER NOT NULL DEFAULT 0;
      `;
    }

    // Check if BozoStat table exists
    const bozoStatTableExists = await prismaClient.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'BozoStat'
      );
    `;

    if (!bozoStatTableExists[0]?.exists) {
      // Create the BozoStat table
      await prismaClient.$executeRaw`
        CREATE TABLE "BozoStat" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "week" INTEGER NOT NULL,
          "season" INTEGER NOT NULL,
          "isBiggestBozo" BOOLEAN NOT NULL DEFAULT false,
          "odds" DECIMAL(65,30),
          "prop" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BozoStat_pkey" PRIMARY KEY ("id")
        );
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema migration completed successfully',
      teamTableExists: teamTableExists[0]?.exists,
      teamIdColumnExists: teamIdColumnExists[0]?.exists,
      totalBozosColumnExists: totalBozosColumnExists[0]?.exists,
      totalHitsColumnExists: totalHitsColumnExists[0]?.exists,
      bozoStatTableExists: bozoStatTableExists[0]?.exists
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
