import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

function parsePrice(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const clean = value.replace(/[$,\s]/g, '');
    return parseFloat(clean) || 0;
  }
  return 0;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    const firestore = db;
    const { id } = await params;
    const docRef = doc(firestore, "tarifas", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    } else {
      return NextResponse.json({ error: 'Tariff not found' }, { status: 404 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    const firestore = db;

    const { id } = await params;
    const body = await request.json();
    
    // Remove ID from body if present
    delete body.id;
    
    // Map fields if necessary
    const updates: any = { ...body };
    
    // If incrementUsage is sent, we should probably handle it or ignore it if we don't want to track usage in Firebase yet.
    // Ideally we would use increment(1) but let's just ignore for now to avoid complexity unless user asked for it.
    if (updates.incrementUsage) {
       // logic to increment usage
       delete updates.incrementUsage;
       // TODO: Implement usage tracking
    }
    
    // Convert numeric fields if they are strings
    ['rabon', 'sencillo', 'sencillo_sobrepeso', 'full', 'full_sobrepeso'].forEach(field => {
        if (updates[field] !== undefined) {
            updates[field] = parsePrice(updates[field]);
        }
    });

    const docRef = doc(firestore, "tarifas", id);
    await updateDoc(docRef, updates);
    
    return NextResponse.json({ message: 'Rate updated successfully' });
  } catch (e: any) {
    console.error("Error updating rate:", e);
    return NextResponse.json({ error: e.message || 'Failed to update rate' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    const firestore = db;
    const { id } = await params;
    await deleteDoc(doc(firestore, "tarifas", id));
    return NextResponse.json({ message: 'Rate deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
