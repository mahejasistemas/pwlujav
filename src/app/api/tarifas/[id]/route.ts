import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Firebase functionality removed
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Firebase functionality removed
  return NextResponse.json({ message: 'Rate updated successfully' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Firebase functionality removed
  return NextResponse.json({ message: 'Rate deleted successfully' });
}
