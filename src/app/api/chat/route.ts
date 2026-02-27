import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getContextData } from './context';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages, isThinkingEnabled } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key not configured' },
        { status: 500 }
      );
    }

    // Fetch platform context data
    const platformData = await getContextData();

    // Use gemini-flash-latest for faster responses
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Construct the prompt history
    const lastMessage = messages[messages.length - 1];
    
    // Format data for prompt
    let contextString = "No se pudo obtener datos en tiempo real de la plataforma.";
    
    if (platformData) {
      try {
        contextString = `
        DATOS ACTUALES DE LA PLATAFORMA (Usa esto para responder):
        
        1. TARIFARIOS (Precios base aproximados):
           - Manzanillo: ${JSON.stringify(platformData.tariffs.manzanillo.map((t: any) => `${t.origen}->${t.destino}: $${t.sencillo} (Sencillo), $${t.full} (Full)`))}
           - Veracruz: ${JSON.stringify(platformData.tariffs.veracruz.map((t: any) => `${t.origen}->${t.destino}: $${t.sencillo} (Sencillo), $${t.full} (Full)`))}
           - Altamira: ${JSON.stringify(platformData.tariffs.altamira.map((t: any) => `${t.origen}->${t.destino}: $${t.sencillo} (Sencillo), $${t.full} (Full)`))}
    
        2. CLIENTES REGISTRADOS (Muestra reciente):
           ${JSON.stringify(platformData.clients.map((c: any) => `${c.name} (${c.company}) - ${c.location} [${c.status}]`))}
    
        3. COTIZACIONES RECIENTES:
           ${JSON.stringify(platformData.recentQuotes.map((q: any) => `${q.origin}->${q.destination} (${q.equipment_type || 'N/A'}): $${q.price} [${q.status}]`))}
    
        4. EQUIPOS DISPONIBLES:
           ${JSON.stringify(platformData.equipment.map((e: any) => `${e.name || e.servicio}: ${e.largo || '?'} largo, Max ${e.peso_max || '?'} tons`))}
        `;
      } catch (err) {
        console.error("Error formatting context data:", err);
        contextString = "Error al procesar los datos de la plataforma. Responde con conocimientos generales.";
      }
    }

    const systemPrompt = `Eres el Asistente Virtual de Lujav, una plataforma de logística y transporte.
    Tu objetivo es ser un experto operativo que ayuda con información precisa sobre tarifas, clientes y estados.
    
    ${contextString}
    
    INSTRUCCIONES CLAVE:
    1. PRIORIDAD MÁXIMA: Usa los datos proporcionados arriba. Si te preguntan "cuánto cuesta ir de X a Y", busca en los TARIFARIOS.
    2. Si encuentras la tarifa exacta, dala. Si no, busca una ruta cercana o di que no tienes esa ruta específica pero puedes estimar.
    3. Para CLIENTES, puedes decir si un cliente existe, su estado y ubicación.
    4. Sé proactivo: Si das un precio, ofrece generar la cotización formal.
    5. Formato de respuesta:
       - NO USES asteriscos dobles (**) para negritas. Usa negritas HTML <b>texto</b> si es estrictamente necesario, o mejor aún, estructura con títulos y listas limpias.
       - Usa EMOJIS al principio de secciones clave para darle un toque moderno (e.g., 📍 Origen, 💰 Precio).
       - Estructura la respuesta en bloques visuales claros.
       - Si un precio es undefined o null, di "Precio a cotizar" en lugar de "$undefined".
    
    ${isThinkingEnabled ? "MODO PENSAMIENTO ACTIVADO: Tu respuesta DEBE incluir un bloque <thinking>...</thinking> al principio." : ""}
    
    Historial de conversación reciente:
    ${messages.slice(-5).map((m: any) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n')}
    
    Responde al último mensaje del Usuario:
    Asistente:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      role: 'assistant',
      content: text
    });

  } catch (error: any) {
    console.error('Error in Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
