import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET - Obtener recomendaciones del usuario
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
    
    // Obtener las últimas 20 recomendaciones
    const recommendations = await db
      .collection('recommendations')
      .find({ userId: payload.userId })
      .sort({ clickedAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener recomendaciones' },
      { status: 500 }
    );
  }
}

// POST - Guardar una nueva recomendación
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
    const {
      bookId,
      title,
      authors,
      thumbnail,
      description,
      publishedDate,
      publisher,
      pageCount,
      rating,
      previewLink,
    } = body;

    if (!bookId || !title || !previewLink) {
      return NextResponse.json(
        { error: 'bookId, title y previewLink son requeridos' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Verificar si ya existe una recomendación para este libro del usuario
    const existing = await db.collection('recommendations').findOne({
      userId: payload.userId,
      bookId: bookId,
    });

    if (existing) {
      // Actualizar la fecha de clic
      await db.collection('recommendations').updateOne(
        { _id: existing._id },
        { $set: { clickedAt: new Date() } }
      );

      return NextResponse.json({
        recommendation: {
          ...existing,
          clickedAt: new Date(),
          id: existing._id.toString(),
        },
      });
    }

    // Crear nueva recomendación
    const newRecommendation = {
      userId: payload.userId,
      bookId,
      title,
      authors,
      thumbnail,
      description,
      publishedDate,
      publisher,
      pageCount,
      rating,
      previewLink,
      clickedAt: new Date(),
    };

    const result = await db.collection('recommendations').insertOne(newRecommendation);

    return NextResponse.json({
      recommendation: {
        ...newRecommendation,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Error al guardar recomendación:', error);
    return NextResponse.json(
      { error: 'Error al guardar recomendación' },
      { status: 500 }
    );
  }
}
