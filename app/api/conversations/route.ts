import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET - Obtener conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.SESSION_COOKIE_NAME || 'session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const conversations = await db
      .collection('conversations')
      .find({ userId: payload.userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva conversación
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(process.env.SESSION_COOKIE_NAME || 'session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, firstMessage } = body;

    const db = await getDatabase();
    const newConversation = {
      userId: payload.userId,
      title: title || 'Nueva conversación',
      preview: firstMessage || '',
      messageCount: firstMessage ? 1 : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('conversations').insertOne(newConversation);

    return NextResponse.json({
      conversation: {
        ...newConversation,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Error al crear conversación:', error);
    return NextResponse.json(
      { error: 'Error al crear conversación' },
      { status: 500 }
    );
  }
}
