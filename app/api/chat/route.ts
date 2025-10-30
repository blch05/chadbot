import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'ChadBot',
  },
  timeout: 60000, // 60 segundos de timeout
  maxRetries: 2, // 2 reintentos en caso de fallo
});

// Función para sanitizar texto
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;')
    .trim()
    .slice(0, 5000); // Limitar longitud máxima
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje inválido' },
        { status: 400 }
      );
    }

    // Sanitizar el mensaje del usuario
    const sanitizedMessage = sanitizeText(message);

    if (sanitizedMessage.length === 0) {
      return NextResponse.json(
        { error: 'El mensaje no puede estar vacío' },
        { status: 400 }
      );
    }

    // Sanitizar el historial
    const sanitizedHistory = conversationHistory
      .filter((msg: any) => msg && typeof msg.role === 'string' && typeof msg.content === 'string')
      .slice(-10)
      .map((msg: any) => ({
        role: msg.role,
        content: sanitizeText(msg.content),
      }));

    const messages = [
      {
        role: 'system' as const,
        content: 'Eres ChadBot, un asistente virtual amable y útil. Responde de manera clara, concisa y profesional en español.',
      },
      ...sanitizedHistory,
      {
        role: 'user' as const,
        content: sanitizedMessage,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
      messages,
      max_tokens: 1000, // Limitar la longitud de la respuesta
      temperature: 0.7, // Controlar la creatividad
    });

    const responseMessage = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

    return NextResponse.json({
      message: responseMessage,
      success: true,
    });
  } catch (error: unknown) {
    console.error('Error al procesar la solicitud:', error);
    
    let errorMessage = 'Error desconocido';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Manejar diferentes tipos de errores
      if (errorMessage.includes('timeout')) {
        errorMessage = 'La solicitud tardó demasiado. Por favor, intenta nuevamente.';
        statusCode = 408;
      } else if (errorMessage.includes('API key')) {
        errorMessage = 'Error de autenticación. Verifica tu API key.';
        statusCode = 401;
      } else if (errorMessage.includes('rate limit')) {
        errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento.';
        statusCode = 429;
      }
    }
    
    return NextResponse.json(
      {
        error: 'Error al procesar tu mensaje',
        details: errorMessage,
      },
      { status: statusCode }
    );
  }
}

