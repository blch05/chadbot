import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

// PUT - Actualizar conversación
export async function PUT(
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
    const { title, messageCount, preview } = body;

    const db = await getDatabase();
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (messageCount !== undefined) updateData.messageCount = messageCount;
    if (preview !== undefined) updateData.preview = preview;

    const result = await db.collection('conversations').updateOne(
      { _id: new ObjectId(id), userId: payload.userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar conversación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar conversación' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar conversación
export async function DELETE(
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
    const result = await db.collection('conversations').deleteOne({
      _id: new ObjectId(id),
      userId: payload.userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar conversación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar conversación' },
      { status: 500 }
    );
  }
}
