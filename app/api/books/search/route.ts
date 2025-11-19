// API Route para buscar libros en Google Books API
import { NextResponse } from 'next/server';
import type { BookSearchParams, BookSearchResponse, Book } from '@/lib/types/book';

export const runtime = 'edge';

// Clave API de Google Books (opcional, pero recomendada para mayor límite de requests)
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const query = searchParams.get('query');
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'El parámetro "query" es requerido' },
        { status: 400 }
      );
    }

    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);
    const orderBy = searchParams.get('orderBy') || 'relevance';
    const startIndex = parseInt(searchParams.get('startIndex') || '0', 10);

    // Validaciones
    if (maxResults < 1 || maxResults > 40) {
      return NextResponse.json(
        { error: 'maxResults debe estar entre 1 y 40' },
        { status: 400 }
      );
    }

    if (!['relevance', 'newest'].includes(orderBy)) {
      return NextResponse.json(
        { error: 'orderBy debe ser "relevance" o "newest"' },
        { status: 400 }
      );
    }

    // Construir URL de Google Books API
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
      orderBy: orderBy,
      startIndex: startIndex.toString(),
      printType: 'books',
      langRestrict: 'es', // Priorizar libros en español
    });

    if (GOOGLE_BOOKS_API_KEY) {
      params.append('key', GOOGLE_BOOKS_API_KEY);
    }

    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;

    // Hacer request a Google Books API
    const response = await fetch(googleBooksUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error de Google Books API:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Error al buscar libros en Google Books' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transformar respuesta de Google Books al formato interno
    const books: Book[] = (data.items || []).map((item: any) => {
      const volumeInfo = item.volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};

      return {
        id: item.id,
        title: volumeInfo.title || 'Sin título',
        authors: volumeInfo.authors || ['Autor desconocido'],
        description: volumeInfo.description || 'Sin descripción disponible',
        thumbnail: imageLinks.thumbnail || imageLinks.smallThumbnail || '',
        publishedDate: volumeInfo.publishedDate || '',
        publisher: volumeInfo.publisher || '',
        pageCount: volumeInfo.pageCount || 0,
        categories: volumeInfo.categories || [],
        averageRating: volumeInfo.averageRating || 0,
        ratingsCount: volumeInfo.ratingsCount || 0,
        language: volumeInfo.language || '',
        previewLink: volumeInfo.previewLink || '',
        infoLink: volumeInfo.infoLink || '',
      };
    });

    const result: BookSearchResponse = {
      books,
      totalItems: data.totalItems || 0,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en /api/books/search:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Error desconocido') : undefined 
      },
      { status: 500 }
    );
  }
}
