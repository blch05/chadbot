import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { searchBooksTool, getBookDetailsTool } from '@/lib/ai/tools';

// Configurar OpenRouter como proveedor personalizado
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'IncelBot',
  },
});

// Configuración de runtime para Edge (opcional, mejora performance)
export const runtime = 'edge';

// Función para sanitizar texto
function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;')
    .trim()
    .slice(0, 5000); // Limitar longitud máxima
}

// Validar estructura de mensajes (AI SDK v5 format)
function validateMessages(messages: any[]): boolean {
  if (!Array.isArray(messages)) return false;
  
  return messages.every(
    (msg) =>
      msg &&
      typeof msg === 'object' &&
      typeof msg.role === 'string' &&
      ['user', 'assistant', 'system'].includes(msg.role) &&
      (
        // Formato v5 con parts
        (Array.isArray(msg.parts) && msg.parts.length > 0) ||
        // Formato legacy con content (por compatibilidad)
        typeof msg.content === 'string'
      )
  );
}

// Extraer texto de los parts del mensaje
function extractTextFromMessage(msg: any): string {
  // Si tiene parts (formato v5)
  if (msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0) {
    return msg.parts
      .filter((part: any) => part && part.type === 'text')
      .map((part: any) => part.text || '')
      .join(' ');
  }
  // Si tiene content (formato legacy)
  if (msg.content && typeof msg.content === 'string') {
    return msg.content;
  }
  // Si content es un array de parts (formato alternativo)
  if (msg.content && Array.isArray(msg.content)) {
    return msg.content
      .filter((part: any) => part && (part.type === 'text' || typeof part === 'string'))
      .map((part: any) => typeof part === 'string' ? part : (part.text || ''))
      .join(' ');
  }
  // Si tiene text directamente
  if (msg.text && typeof msg.text === 'string') {
    return msg.text;
  }
  return '';
}

export async function POST(req: Request) {
  try {
    // Validar Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type debe ser application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse del body con manejo de errores
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'JSON inválido en el body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = body;

    // Validación de mensajes
    if (!messages || !validateMessages(messages)) {
      return new Response(
        JSON.stringify({ error: 'Formato de mensajes inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitizar mensajes y convertir al formato esperado por streamText
    const sanitizedMessages = messages
      .slice(-20) // Limitar historial a últimos 20 mensajes
      .map((msg: any) => {
        const textContent = extractTextFromMessage(msg);
        const sanitizedText = sanitizeText(textContent);
        
        // Solo incluir mensajes con contenido
        if (sanitizedText.length === 0) return null;
        
        // Convertir al formato simple esperado por streamText
        return {
          role: msg.role,
          content: sanitizedText,
        };
      })
      .filter((msg: any) => msg !== null); // Filtrar mensajes nulos

    // Validar API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY no está configurada');
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Streaming de respuesta con mensaje del sistema incluido
    // Crear herramienta dinámica que pueda agregar libros a la lista del usuario.
    // Esta herramienta usará las cookies de la petición original para autenticar la acción
    // llamando al endpoint interno `/api/reading-list`.
  const addToReadingListTool = (tool as any)({
      description: `Agrega un libro a la lista de lectura del usuario autenticado. Si se pasa sólo bookId, la herramienta intentará obtener los detalles del libro antes de agregarlo.`,
      parameters: z.object({
        bookId: z.string().describe('ID del libro en Google Books'),
        priority: z.enum(['high', 'medium', 'low']).optional().describe('Prioridad opcional'),
        notes: z.string().optional().describe('Notas opcionales para el libro'),
      }),
  execute: async (params: any) => {
        try {
          const { bookId, priority, notes } = params;

          // Obtener cookies de la petición original y reenviarlas
          const cookieHeader = req.headers.get('cookie') || '';

          // Intentar obtener detalles del libro desde nuestra API de libros
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          const detailsResp = await fetch(`${siteUrl}/api/books/${encodeURIComponent(bookId)}`);

          if (!detailsResp.ok) {
            const err = await detailsResp.json().catch(() => ({ error: 'No se pudieron obtener detalles del libro' }));
            return { success: false, error: err.error || 'Error al obtener detalles del libro' };
          }

          const detailsData = await detailsResp.json();
          const book = detailsData.book;

          // Construir payload mínimo requerido por /api/reading-list
          const payload: any = {
            bookId: bookId,
            title: book.title || 'Título desconocido',
            authors: book.authors || [],
            thumbnail: book.imageLinks?.thumbnail || null,
            description: book.description || null,
            publishedDate: book.publishedDate || null,
            pageCount: book.pageCount || null,
            categories: book.categories || [],
            averageRating: book.averageRating || null,
            priority: priority,
            notes: notes || '',
          };

          // Llamada al endpoint interno para agregar a la lista, reenviando cookie para autenticar
          const addResp = await fetch(`${siteUrl}/api/reading-list`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // reenviar cookies para que el endpoint pueda verificar el token
              cookie: cookieHeader,
            },
            body: JSON.stringify(payload),
          });

          if (!addResp.ok) {
            const err = await addResp.json().catch(() => ({ error: 'Error al agregar el libro' }));
            return { success: false, error: err.error || 'Error al agregar el libro a la lista' };
          }

          const addData = await addResp.json();
          return { success: true, message: addData.message || 'Libro agregado a la lista', book: addData.book };
        } catch (error) {
          console.error('addToReadingListTool error:', error);
          return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
        }
      },
    });

    // Tool para obtener estadísticas de lectura del usuario (usa cookie para autenticar)
  const getReadingStatsTool = (tool as any)({
      description: `Obtiene estadísticas de lectura del usuario autenticado. Parámetros: period (all-time|year|month|week), groupBy (genre|author|year).`,
      parameters: z.object({
        period: z.enum(['all-time', 'year', 'month', 'week']).optional(),
        groupBy: z.enum(['genre', 'author', 'year']).optional(),
      }),
  execute: async (params: any) => {
        try {
          const cookieHeader = req.headers.get('cookie') || '';
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

          const resp = await fetch(`${siteUrl}/api/reading-stats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: cookieHeader,
            },
            body: JSON.stringify({ period: params.period || 'all-time', groupBy: params.groupBy }),
          });

          if (!resp.ok) {
            const err = await resp.json().catch(() => ({ error: 'Error al obtener estadísticas' }));
            return { success: false, error: err.error || 'Error al obtener estadísticas' };
          }

          const data = await resp.json();
          return { success: true, stats: data };
        } catch (error) {
          console.error('getReadingStatsTool error:', error);
          return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
        }
      },
    });

    const result = await streamText({
      model: openrouter.chat(process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'),
      system: `Eres Leo, un asistente virtual especializado en libros, amable y útil. Tu misión es ayudar a los usuarios a descubrir y conocer más sobre libros. Responde de manera clara, concisa y profesional en español.

REGLAS IMPORTANTES SOBRE LAS HERRAMIENTAS:

1. **searchBooks**: Úsala para búsquedas de libros (múltiples resultados)
   - "libros de terror" → searchBooks con query="terror"
   - "novelas de García Márquez" → searchBooks con query="García Márquez"
   - "libros de romance" → searchBooks con query="romance"
   - ⚠️ CADA NUEVA BÚSQUEDA ES INDEPENDIENTE - Ignora búsquedas anteriores
   - ⚠️ NO combines múltiples búsquedas en una sola query

2. **getBookDetails**: Úsala para información detallada de UN libro específico
   - "Dame más información del primer libro"
   - "Detalles del libro [bookId]"
   - Requiere el bookId del libro
   - Devuelve información COMPLETA

COMPORTAMIENTO CON BÚSQUEDAS SECUENCIALES:

Situación: Usuario hace una búsqueda, luego pide otra DIFERENTE
Usuario: "libros de terror"
Tú: [searchBooks con query="terror"]
Usuario: "ahora de romance"  ← NUEVA BÚSQUEDA INDEPENDIENTE
Tú: [searchBooks con query="romance"]  ← SOLO romance, NO "terror y romance"
⛔ NO combines: "terror romance"
⛔ NO uses: query="terror y romance"
✅ USA: query="romance" (SOLO el nuevo tema)

Situación: Usuario pide detalles después de búsqueda
Usuario: "libros de ciencia ficción"
Tú: [searchBooks con query="ciencia ficción"]
Usuario: "más info del primero"  ← PIDE DETALLES, NO NUEVA BÚSQUEDA
Tú: [getBookDetails con bookId del primer libro]
⛔ NO uses searchBooks de nuevo

REGLAS CRÍTICAS:
❌ NUNCA combines temas de búsquedas diferentes
❌ NUNCA uses searchBooks Y getBookDetails en la misma respuesta
❌ Una herramienta por respuesta
❌ Cada búsqueda es INDEPENDIENTE de las anteriores
✅ Nueva búsqueda = Ignora la anterior completamente
✅ Usa SOLO el tema que el usuario menciona en su último mensaje
✅ "ahora de X" = searchBooks con query="X" solamente

No generes contenido dañino, ofensivo o inapropiado.`,
      messages: sanitizedMessages,
      temperature: 0.7,
      maxRetries: 2,
      tools: {
        searchBooks: searchBooksTool,
        getBookDetails: getBookDetailsTool,
        addToReadingList: addToReadingListTool,
        getReadingStats: getReadingStatsTool,
      },
    });

    // Retornar stream en formato UI Message Stream para AI SDK v5
    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error('Error en /api/chat:', error);

    // Manejo específico de errores
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;

    if (error instanceof Error) {
      // Timeout
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'La solicitud tardó demasiado. Por favor, intenta nuevamente.';
        statusCode = 408;
      }
      // API Key inválida
      else if (error.message.includes('API key') || error.message.includes('401')) {
        errorMessage = 'Error de autenticación con el servicio de IA.';
        statusCode = 401;
      }
      // Rate limit
      else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento.';
        statusCode = 429;
      }
      // Modelo no disponible
      else if (error.message.includes('model') || error.message.includes('404')) {
        errorMessage = 'El modelo de IA no está disponible actualmente.';
        statusCode = 503;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Error desconocido') : undefined,
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

