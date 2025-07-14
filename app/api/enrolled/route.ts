/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export async function GET() {
  console.log('📋 API: Fetching all enrolled users');
  
  try {
    const users = await getAllUsers();
    console.log('✅ API: Retrieved', users.length, 'users from Supabase');
    return NextResponse.json(users);
  } catch (error) {
    console.error('❌ API: Failed to fetch users from Supabase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}