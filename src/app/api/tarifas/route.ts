import { NextResponse } from 'next/server';

export async function GET() {
  // Firebase functionality removed
  return NextResponse.json([]);
}

export async function POST(request: Request) {
  // Firebase functionality removed
  return NextResponse.json({ success: true, id: 'mock-id' });
}
