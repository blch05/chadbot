import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    maturityRating?: string;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
  saleInfo?: {
    country?: string;
    saleability?: string;
    isEbook?: boolean;
    listPrice?: {
      amount: number;
      currencyCode: string;
    };
    retailPrice?: {
      amount: number;
      currencyCode: string;
    };
    buyLink?: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de libro requerido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const url = `https://www.googleapis.com/books/v1/volumes/${id}${
      apiKey ? `?key=${apiKey}` : ''
    }`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Libro no encontrado' },
          { status: 404 }
        );
      }
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data: GoogleBookVolume = await response.json();

    // Formatear la respuesta con toda la información detallada
    const bookDetails = {
      id: data.id,
      title: data.volumeInfo.title,
      subtitle: data.volumeInfo.subtitle,
      authors: data.volumeInfo.authors || [],
      publisher: data.volumeInfo.publisher,
      publishedDate: data.volumeInfo.publishedDate,
      description: data.volumeInfo.description,
      isbn: data.volumeInfo.industryIdentifiers?.map(id => ({
        type: id.type,
        identifier: id.identifier,
      })) || [],
      pageCount: data.volumeInfo.pageCount,
      categories: data.volumeInfo.categories || [],
      averageRating: data.volumeInfo.averageRating,
      ratingsCount: data.volumeInfo.ratingsCount,
      maturityRating: data.volumeInfo.maturityRating,
      language: data.volumeInfo.language,
      imageLinks: {
        smallThumbnail: data.volumeInfo.imageLinks?.smallThumbnail,
        thumbnail: data.volumeInfo.imageLinks?.thumbnail,
        small: data.volumeInfo.imageLinks?.small,
        medium: data.volumeInfo.imageLinks?.medium,
        large: data.volumeInfo.imageLinks?.large,
        extraLarge: data.volumeInfo.imageLinks?.extraLarge,
      },
      previewLink: data.volumeInfo.previewLink,
      infoLink: data.volumeInfo.infoLink,
      canonicalVolumeLink: data.volumeInfo.canonicalVolumeLink,
      saleInfo: data.saleInfo ? {
        country: data.saleInfo.country,
        saleability: data.saleInfo.saleability,
        isEbook: data.saleInfo.isEbook,
        listPrice: data.saleInfo.listPrice,
        retailPrice: data.saleInfo.retailPrice,
        buyLink: data.saleInfo.buyLink,
      } : null,
    };

    return NextResponse.json({
      success: true,
      book: bookDetails,
    });
  } catch (error: any) {
    console.error('Error fetching book details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener detalles del libro' },
      { status: 500 }
    );
  }
}
