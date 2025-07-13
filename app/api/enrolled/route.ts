/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface EnrolledUser {
  id: string;
  name: string;
  email: string;
  telephone: string;
  enrolledAt: string;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'enrolled-users.json');
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const users: EnrolledUser[] = JSON.parse(data);
      return NextResponse.json(users);
    } catch (error) {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}