import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

function parsePrice(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove '$', commas, and spaces
    const clean = value.replace(/[$,\s]/g, '');
    return parseFloat(clean) || 0;
  }
  return 0;
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    // Fetch all tariffs
    const q = query(collection(db, "tarifas"));
    const snapshot = await getDocs(q);
    
    const tariffs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Map fields to ensure compatibility with frontend if they differ
        // Frontend expects: origen, destino, rabon, sencillo, sencillo_sobrepeso, full, full_sobrepeso
        rabon: parsePrice(data.rabon),
        sencillo: parsePrice(data.sencillo),
        sencillo_sobrepeso: parsePrice(data.sencillo_sobrepeso || data.sencillo_sp),
        full: parsePrice(data.full || data.fulls || data.full_price),
        full_sobrepeso: parsePrice(data.full_sobrepeso || data.full_sp),
      };
    });
    
    return NextResponse.json(tariffs);
  } catch (e: any) {
    console.error("Error fetching rates from Firebase:", e);
    return NextResponse.json({ error: e.message || 'Failed to fetch rates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const body = await request.json();
    
    if (Array.isArray(body)) {
       const promises = body.map(async (item) => {
         const docData = {
           origen: item.origen || item.origin || '',
           destino: item.destino || item.destination || '',
           rabon: parsePrice(item.rabon),
           sencillo: parsePrice(item.sencillo),
           sencillo_sobrepeso: parsePrice(item.sencillo_sobrepeso || item.sencillo_sp),
           full: parsePrice(item.full || item.fulls || item.full_price),
           full_sobrepeso: parsePrice(item.full_sobrepeso || item.full_sp),
           createdAt: new Date().toISOString()
         };
         const ref = await addDoc(collection(db, "tarifas"), docData);
         return ref.id;
       });
       
       const ids = await Promise.all(promises);
       return NextResponse.json({ success: true, count: ids.length, ids });
    } else {
        const docData = {
           origen: body.origen || body.origin || '',
           destino: body.destino || body.destination || '',
           rabon: parsePrice(body.rabon),
           sencillo: parsePrice(body.sencillo),
           sencillo_sobrepeso: parsePrice(body.sencillo_sobrepeso || body.sencillo_sp),
           full: parsePrice(body.full || body.fulls || body.full_price),
           full_sobrepeso: parsePrice(body.full_sobrepeso || body.full_sp),
           createdAt: new Date().toISOString()
         };
         const ref = await addDoc(collection(db, "tarifas"), docData);
         return NextResponse.json({ success: true, id: ref.id });
    }

  } catch (e: any) {
    console.error("Error adding rates to Firebase:", e);
    return NextResponse.json({ error: e.message || 'Failed to add rates' }, { status: 500 });
  }
}
