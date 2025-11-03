import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

// GET - Obtener mensajes de una conversación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    // Verificar que la conversación pertenezca al usuario
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
      userId: payload.userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Obtener mensajes de la conversación
    const messages = await db
      .collection('messages')
      .find({ conversationId: id })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

// POST - Guardar mensaje en una conversación
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { role, content, books } = body;

    // Validar que exista role y (content O books)
    if (!role || (!content && (!books || books.length === 0))) {
      return NextResponse.json(
        { error: 'Role y (content o books) son requeridos' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Verificar que la conversación pertenezca al usuario
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
      userId: payload.userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya existe un mensaje idéntico reciente (últimos 2 segundos)
    const recentDuplicate = await db.collection('messages').findOne({
      conversationId: id,
      role,
      content,
      createdAt: { 
        $gte: new Date(Date.now() - 2000) // Últimos 2 segundos
      }
    });

    if (recentDuplicate) {
      // Ya existe, retornar el existente sin crear duplicado
      return NextResponse.json({
        message: {
          ...recentDuplicate,
          id: recentDuplicate._id.toString(),
        },
      });
    }

    // Guardar mensaje
    const newMessage = {
      conversationId: id,
      role,
      content,
      books: books || [], // Guardar el array de libros si existe
      createdAt: new Date(),
    };

    const result = await db.collection('messages').insertOne(newMessage);

    // Actualizar el updatedAt de la conversación para que se mueva al principio
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      message: {
        ...newMessage,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Error al guardar mensaje:', error);
    return NextResponse.json(
      { error: 'Error al guardar mensaje' },
      { status: 500 }
    );
  }
}
