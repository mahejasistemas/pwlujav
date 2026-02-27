import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client for server-side data fetching
// We need the SERVICE_ROLE_KEY or just use the public key if RLS allows public read (which seems to be the case for tariffs)
// For security in a real app, we should use the service role key for backend operations, 
// but based on .env.local only public key is available. 
// However, the user asked to read data that is seemingly public or available to the user.
// Let's use the public key/url from environment variables.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getContextData() {
  try {
    // 1. Fetch Tariffs (Manzanillo, Veracruz, Altamira) - Limit to 20 examples
    const [manzanillo, veracruz, altamira] = await Promise.all([
      supabase.from('manzanillo').select('*').limit(20),
      supabase.from('veracruz').select('*').limit(20),
      supabase.from('altamira').select('*').limit(20)
    ]);

    // 2. Fetch Clients (Limit 20)
    const clients = await supabase.from('clients').select('name, company, location, status, service_type').limit(20);

    // 3. Fetch Recent Quotes (Limit 10)
    const quotes = await supabase.from('quotes').select('origin, destination, price, status, created_at, equipment_type').limit(10).order('created_at', { ascending: false });

    // 4. Fetch Equipment Types
    const equipment = await supabase.from('carga_general').select('name, largo, peso_max, servicio').limit(15);

    return {
      tariffs: {
        manzanillo: manzanillo.data || [],
        veracruz: veracruz.data || [],
        altamira: altamira.data || []
      },
      clients: clients.data || [],
      recentQuotes: quotes.data || [],
      equipment: equipment.data || []
    };
  } catch (error) {
    console.error("Error fetching context data:", error);
    return null;
  }
}
