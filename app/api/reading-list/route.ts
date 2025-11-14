import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET - Obtener lista de lectura del usuario
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
    
    // Obtener libros de la lista de lectura
    const books = await db
      .collection('reading_list')
      .find({ userId: payload.userId })
      .sort({ addedAt: -1 })
      .toArray();

    return NextResponse.json({
      books: books.map(book => ({
        ...book,
        _id: book._id.toString(),
      })),
      total: books.length,
    });
  } catch (error) {
    console.error('Error al obtener lista de lectura:', error);
    return NextResponse.json(
      { error: 'Error al obtener lista de lectura' },
      { status: 500 }
    );
  }
}

// POST - Agregar libro a la lista de lectura
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
  const { bookId, title, authors, thumbnail, description, publishedDate, pageCount, categories, averageRating, priority, notes } = body;

    if (!bookId || !title) {
      return NextResponse.json(
        { error: 'bookId y title son requeridos' },
        { status: 400 }
      );
    }

    // Validar priority si se proporciona
    const allowedPriorities = ['high', 'medium', 'low'];
    const chosenPriority = priority && allowedPriorities.includes(priority) ? priority : 'medium';

    const db = await getDatabase();
    
    // Verificar si el libro ya está en la lista
    const existingBook = await db.collection('reading_list').findOne({
      userId: payload.userId,
      bookId: bookId,
    });

    if (existingBook) {
      return NextResponse.json(
        { error: 'El libro ya está en tu lista de lectura' },
        { status: 409 }
      );
    }

    // Agregar libro a la lista
    const newBook = {
      userId: payload.userId,
      bookId,
      title,
      authors: authors || [],
      thumbnail,
      description,
      publishedDate,
      pageCount,
      categories: categories || [],
      averageRating,
      addedAt: new Date(),
      isRead: false,
      priority: chosenPriority,
      notes: notes || '',
    };

    const result = await db.collection('reading_list').insertOne(newBook);

    return NextResponse.json({
      book: {
        ...newBook,
        _id: result.insertedId.toString(),
      },
      message: 'Libro agregado a tu lista de lectura',
    });
  } catch (error) {
    console.error('Error al agregar libro a lista:', error);
    return NextResponse.json(
      { error: 'Error al agregar libro a lista de lectura' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar libro de la lista de lectura
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json(
        { error: 'bookId es requerido' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db.collection('reading_list').deleteOne({
      userId: payload.userId,
      bookId: bookId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Libro no encontrado en tu lista' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Libro eliminado de tu lista de lectura',
    });
  } catch (error) {
    console.error('Error al eliminar libro de lista:', error);
    return NextResponse.json(
      { error: 'Error al eliminar libro de lista de lectura' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar libro como leído
export async function PATCH(request: NextRequest) {
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
    const { bookId, rating, review, dateFinished } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: 'bookId es requerido' },
        { status: 400 }
      );
    }

    // Validar rating si se proporciona
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'El rating debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Actualizar el libro en la lista
    const updateData: any = {
      isRead: true,
      dateFinished: dateFinished ? new Date(dateFinished) : new Date(),
    };

    if (rating !== undefined) {
      updateData.userRating = rating;
    }

    if (review) {
      updateData.userReview = review;
    }

    const result = await db.collection('reading_list').updateOne(
      {
        userId: payload.userId,
        bookId: bookId,
      },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Libro no encontrado en tu lista' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Libro marcado como leído',
      data: updateData,
    });
  } catch (error) {
    console.error('Error al marcar libro como leído:', error);
    return NextResponse.json(
      { error: 'Error al marcar libro como leído' },
      { status: 500 }
    );
  }
}
