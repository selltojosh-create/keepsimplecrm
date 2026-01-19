import { NextResponse } from 'next/server';
import { invalidateSession } from '@/lib/auth';

export async function POST() {
  try {
    await invalidateSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
