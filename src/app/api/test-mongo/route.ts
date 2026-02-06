import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("admin");
    
    // Send a ping to confirm a successful connection
    await db.command({ ping: 1 });
    
    return NextResponse.json({ 
      status: 'success', 
      message: "Pinged your deployment. You successfully connected to MongoDB!" 
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ 
      status: 'error', 
      message: "Failed to connect to MongoDB",
      error: String(e) 
    }, { status: 500 });
  }
}
